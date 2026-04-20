<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Api\CustomerController;
use App\Models\Coupon;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Product;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;
use App\Http\Resources\SaleResource;
use Illuminate\Support\Facades\Response;

class SaleController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\JsonResponse
     */
     public function index(Request $request): JsonResponse
     {
         $perPage = $request->input('per_page', 15);
         
         $query = Sale::with('user', 'saleItems.product');

         // Filter by invoice number if provided
         if ($request->has('invoice_number')) {
             $query->where('invoice_number', $request->input('invoice_number'));
         }

         // Filter by date range if provided
         if ($request->has('from_date')) {
             $query->whereDate('sale_datetime', '>=', $request->input('from_date'));
         }
         if ($request->has('to_date')) {
             $query->whereDate('sale_datetime', '<=', $request->input('to_date'));
         }

         $sales = $query->orderBy('sale_datetime', 'desc')->paginate($perPage);

         return SaleResource::collection($sales)->response()->setStatusCode(200);
     }

     /**
      * Export sales to CSV
      */
     public function export(Request $request)
     {
         $query = Sale::with(['user', 'customer', 'saleItems.product']);

         // Apply same filters as index
         if ($request->has('invoice_number')) {
             $query->where('invoice_number', $request->input('invoice_number'));
         }
         if ($request->has('from_date')) {
             $query->whereDate('sale_datetime', '>=', $request->input('from_date'));
         }
         if ($request->has('to_date')) {
             $query->whereDate('sale_datetime', '<=', $request->input('to_date'));
         }

         $sales = $query->orderBy('sale_datetime', 'desc')->get();

         $filename = 'sales_' . now()->format('Ymd_His') . '.csv';
         $headers = [
             'Content-Type' => 'text/csv; charset=UTF-8',
             'Content-Disposition' => "attachment; filename=\"$filename\"",
         ];

         $callback = function() use ($sales) {
             $file = fopen('php://output', 'w');
             fprintf($file, chr(0xEF).chr(0xBB).chr(0xBF));
             fputcsv($file, ['ID', 'Invoice Number', 'Date', 'Customer', 'Cashier', 'Payment Method', 'Subtotal', 'Tax', 'Discount', 'Total']);
             foreach ($sales as $sale) {
                 fputcsv($file, [
                     $sale->id,
                     $sale->invoice_number,
                     $sale->sale_datetime ? \Carbon\Carbon::parse($sale->sale_datetime)->format('Y-m-d H:i') : '',
                     optional($sale->customer)->name ?? 'Walk-in',
                     optional($sale->user)->name ?? 'N/A',
                     $sale->payment_method ?? 'cash',
                     number_format($sale->subtotal, 2, '.', ''),
                     number_format($sale->tax_amount, 2, '.', ''),
                     number_format($sale->discount_amount, 2, '.', ''),
                     number_format($sale->total_amount, 2, '.', ''),
                 ]);
             }
             fclose($file);
         };

         return response()->stream($callback, 200, $headers);
     }

     /**
      * Display the specified resource.
      *
      * @param  int  $id
      * @return \Illuminate\Http\JsonResponse
      */
    public function show(int $id): JsonResponse
    {
        // EAGER LOAD relationships for the specific sale
        $sale = Sale::with('user', 'saleItems.product')->findOrFail($id);
        return (new SaleResource($sale))->response()->setStatusCode(200);
    }

    /**
     * Store a newly created resource in storage (PROCESS A SALE).
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        // --- Request Validation ---
        // This is a simplified validation. A real system would need much more robust validation.
        $request->validate([
            'customer_name' => 'nullable|string|max:255',
            'customer_id' => 'nullable|exists:customers,id',
            'user_id' => 'required|exists:users,id', // Ensure the user exists
            'coupon_code' => 'nullable|string|max:50',
            'discount_amount' => 'nullable|numeric|min:0',
            'products' => 'required|array|min:1', // Requires at least one product
            'products.*.product_id' => 'required|exists:products,id',
            'products.*.quantity' => 'required|integer|min:1',
        ]);

        // --- Transaction Start ---
        // We wrap this whole process in a database transaction to ensure atomicity.
        // If any step fails, all changes are rolled back.
        DB::beginTransaction();

        try {
            $products_data = $request->input('products');
            $userId = $request->input('user_id');
            $customerName = $request->input('customer_name');
            $customerId = $request->input('customer_id'); // Get customer_id from request
            $couponCode = $request->input('coupon_code');
            $requestedDiscount = round((float) $request->input('discount_amount', 0), 2);
            $coupon = null;

            $subtotal = 0;
            $totalTax = 0;
            $totalDiscount = 0;
            $saleItemsToCreate = []; // To hold data for bulk insert
            $productsToUpdateStock = []; // To hold stock updates
            $taxRate = Setting::get('tax_rate', 10.00) / 100;
            $taxEnabled = Setting::get('tax_enabled', true);

            // --- Process Products and Calculate Totals ---
            foreach ($products_data as $item_data) {
                $product = Product::query()->lockForUpdate()->findOrFail($item_data['product_id']);
                $quantity = $item_data['quantity'];

                // 1. Check Stock Availability (Crucial!)
                // Note: For high-concurrency systems, you might need more sophisticated locking
                // than just a simple query check.
                if ($product->stock_quantity < $quantity) {
                    throw new \Exception("Insufficient stock for product {$product->name} (SKU: {$product->sku}). Available: {$product->stock_quantity}");
                }

                // 2. Determine Unit Price (use current product price, can be overridden)
                $unitPrice = $product->price;
                $lineItemSubtotal = $unitPrice * $quantity;

                // 3. Prepare line item values
                $lineItemTax = 0;
                $lineItemDiscount = 0.00;

                // 4. Aggregate totals
                $subtotal += $lineItemSubtotal;
                $totalDiscount += $lineItemDiscount;

                // 5. Prepare SaleItem data
                $saleItemsToCreate[] = [
                    'product_id' => $product->id,
                    'quantity' => $quantity,
                    'unit_price' => $unitPrice,
                    'line_item_total' => $lineItemSubtotal, // This is after discounts/before tax for line item
                    'line_item_tax' => $lineItemTax,
                    'line_item_discount' => $lineItemDiscount,
                    // We'll calculate final line_item_total, line_item_tax, line_item_discount
                    // based on what the 'line_item_total' represents (e.g., net of discount)
                ];

                // 6. Prepare Product Stock Update
                $productsToUpdateStock[$product->id] = $product->stock_quantity - $quantity;
            }

            if ($couponCode) {
                $coupon = Coupon::query()
                    ->lockForUpdate()
                    ->where('code', strtoupper($couponCode))
                    ->first();

                if (!$coupon) {
                    throw new \Exception('The selected coupon code is invalid.');
                }

                if (!$coupon->isValid()) {
                    throw new \Exception('The selected coupon is expired, inactive, or has reached its usage limit.');
                }

                if (!$coupon->meetsMinimumAmount($subtotal)) {
                    throw new \Exception('The selected coupon does not meet the minimum order amount.');
                }

                $totalDiscount = round($coupon->calculateDiscount($subtotal), 2);
                $couponCode = $coupon->code;
            } elseif ($requestedDiscount > 0) {
                throw new \Exception('A discount amount cannot be applied without a valid coupon code.');
            }

            if ($coupon && abs($requestedDiscount - $totalDiscount) > 0.01) {
                throw new \Exception('The submitted discount does not match the selected coupon.');
            }

            $totalDiscount = min($totalDiscount, $subtotal);
            $taxableSubtotal = max($subtotal - $totalDiscount, 0);
            $totalTax = $taxEnabled ? round($taxableSubtotal * $taxRate, 2) : 0;

            // Final calculation for the Sale model
            $finalTotalAmount = round($subtotal + $totalTax - $totalDiscount, 2);

            // --- Create the Sale Record ---
            $sale = Sale::create([
                'invoice_number' => Sale::generateInvoiceNumber(),
                'customer_name' => $customerName,
                'customer_id' => $customerId, // Save customer_id
                'user_id' => $userId,
                'sale_datetime' => Carbon::now(),
                'subtotal' => $subtotal,
                'tax_amount' => $totalTax,
                'discount_amount' => $totalDiscount,
                'coupon_code' => $couponCode,
                'total_amount' => $finalTotalAmount,
            ]);

            if ($coupon) {
                $coupon->recordUsage();
            }

            // --- Process and Attach Sale Items ---
            foreach ($saleItemsToCreate as $itemData) {
                // Recalculate final line_item_total
                $itemData['line_item_total'] = $itemData['quantity'] * $itemData['unit_price'];
                
                // Create and save each sale item directly
                SaleItem::create([
                    'sale_id' => $sale->id,
                    'product_id' => $itemData['product_id'],
                    'quantity' => $itemData['quantity'],
                    'unit_price' => $itemData['unit_price'],
                    'line_item_total' => $itemData['line_item_total'],
                    'line_item_tax' => $itemData['line_item_tax'],
                    'line_item_discount' => $itemData['line_item_discount'],
                ]);
            }

            // --- Update Product Stock ---
            foreach ($productsToUpdateStock as $productId => $newStock) {
                Product::where('id', $productId)->update(['stock_quantity' => $newStock]);
            }

            // --- Commit Transaction ---
            DB::commit();

            // Clear caches after new sale
            Cache::forget('dashboard.stats');
            Cache::forget('dashboard.low_stock');

            // Update customer statistics if customer_id is provided
            if ($sale->customer_id) {
                $customer = \App\Models\Customer::find($sale->customer_id);
                if ($customer) {
                    $customer->increment('total_purchases');
                    $customer->increment('total_spent', $sale->total_amount);
                }
            }

            CustomerController::bumpCustomerCacheVersion();

            // Return the created sale with eager-loaded details
            return (new SaleResource($sale->load('user', 'customer', 'saleItems.product')))->response()->setStatusCode(201);

        } catch (\Exception $e) {
            // --- Rollback Transaction on Error ---
            DB::rollBack();

            // Log the error details for debugging
            Log::error("Sale creation failed: " . $e->getMessage() . "\n" . $e->getTraceAsString());

            // Return error response
            return response()->json([
                'message' => 'Failed to create sale.',
                'error' => $e->getMessage(), // Expose error message for debugging, remove in production
            ], 422); // Unprocessable Entity
        }
    }

    // Note: update and destroy methods for Sales are usually not implemented
    // in simple POS systems for historical integrity. You might instead
    // implement a "void" or "refund" functionality which creates a new
    // negative transaction or marks the sale as voided.
}
