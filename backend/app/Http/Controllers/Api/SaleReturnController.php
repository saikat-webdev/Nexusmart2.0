<?php

 namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\SaleReturn;
use App\Models\Product;
use App\Http\Resources\SaleReturnResource;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Response;

class SaleReturnController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        $perPage = $request->input('per_page', 20);

        $query = SaleReturn::with(['sale', 'product', 'user']);

        // Filter by sale_id if provided
        if ($request->has('sale_id')) {
            $query->where('sale_id', $request->input('sale_id'));
        }

        // Filter by date range if provided
        if ($request->has('from_date')) {
            $query->whereDate('created_at', '>=', $request->input('from_date'));
        }
        if ($request->has('to_date')) {
            $query->whereDate('created_at', '<=', $request->input('to_date'));
        }

        // Filter by status if provided
        if ($request->has('status')) {
            $query->where('status', $request->input('status'));
        }

         $returns = $query->orderByDesc('created_at')->paginate($perPage);

         return response()->json(SaleReturnResource::collection($returns), 200);
     }

     /**
      * Export returns to CSV
      */
     public function export(Request $request)
     {
         $query = SaleReturn::with(['sale', 'product', 'user']);

         // Apply same filters as index
         if ($request->has('sale_id')) {
             $query->where('sale_id', $request->input('sale_id'));
         }
         if ($request->has('from_date')) {
             $query->whereDate('created_at', '>=', $request->input('from_date'));
         }
         if ($request->has('to_date')) {
             $query->whereDate('created_at', '<=', $request->input('to_date'));
         }
         if ($request->has('status')) {
             $query->where('status', $request->input('status'));
         }

         $returns = $query->orderByDesc('created_at')->get();

         $filename = 'returns_' . now()->format('Ymd_His') . '.csv';
         $headers = [
             'Content-Type' => 'text/csv; charset=UTF-8',
             'Content-Disposition' => "attachment; filename=\"$filename\"",
         ];

         $callback = function() use ($returns) {
             $file = fopen('php://output', 'w');
             fprintf($file, chr(0xEF).chr(0xBB).chr(0xBF));
             fputcsv($file, ['ID', 'Sale ID', 'Invoice', 'Product', 'Quantity', 'Refund Amount', 'Reason', 'Status', 'Processed By', 'Date']);
             foreach ($returns as $ret) {
                 fputcsv($file, [
                     $ret->id,
                     $ret->sale_id,
                     optional($ret->sale)->invoice_number ?? 'N/A',
                     optional($ret->product)->name ?? 'N/A',
                     $ret->quantity,
                     number_format($ret->refund_amount, 2, '.', ''),
                     $ret->reason ?? '',
                     ucfirst($ret->status),
                     optional($ret->user)->name ?? 'System',
                     $ret->created_at?->format('Y-m-d H:i') ?? '',
                 ]);
             }
             fclose($file);
         };

         return response()->stream($callback, 200, $headers);
     }

     /**
      * Store a newly created resource in storage.
      */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'sale_id' => 'required|integer|exists:sales,id',
            'sale_item_id' => 'required|integer|exists:sale_items,id',
            'product_id' => 'required|integer|exists:products,id',
            'quantity' => 'required|integer|min:1',
            'reason' => 'nullable|string|max:500',
            'status' => ['sometimes', Rule::in(['pending', 'completed', 'rejected'])],
        ]);

        $saleItem = SaleItem::with('sale')->findOrFail($validated['sale_item_id']);

        // Validate that the sale_item belongs to the given sale
        if ($saleItem->sale_id != $validated['sale_id']) {
            return response()->json(['message' => 'Sale item does not belong to the specified sale.'], 422);
        }

        // Validate that the product_id matches the sale item's product
        if ($saleItem->product_id != $validated['product_id']) {
            return response()->json(['message' => 'Product does not match the sale item.'], 422);
        }

        // Ensure sale has not been fully returned
        $totalReturned = SaleReturn::where('sale_item_id', $saleItem->id)
            ->where('status', 'completed')
            ->sum('quantity');

        $maxReturnable = $saleItem->quantity - $totalReturned;
        if ($validated['quantity'] > $maxReturnable) {
            return response()->json([
                'message' => "Cannot return more than remaining quantity. Available: {$maxReturnable}"
            ], 422);
        }

        // Compute refund amount: use original unit_price * quantity
        // If sale item had tax/discount, we may need to adjust; for now use unit_price
        $unitPrice = $saleItem->unit_price;
        $refundAmount = $unitPrice * $validated['quantity'];

        $status = $validated['status'] ?? 'completed';

        // Use transaction to ensure consistency
        DB::beginTransaction();

        try {
            // Update product stock if return is completed
            if ($status === 'completed') {
                Product::where('id', $validated['product_id'])->increment('stock_quantity', $validated['quantity']);
            }

            $return = SaleReturn::create([
                'sale_id' => $validated['sale_id'],
                'sale_item_id' => $validated['sale_item_id'],
                'product_id' => $validated['product_id'],
                'quantity' => $validated['quantity'],
                'refund_amount' => $refundAmount,
                'reason' => $validated['reason'] ?? null,
                'status' => $status,
                'user_id' => $request->user()?->id,
            ]);

            DB::commit();

            return (new SaleReturnResource($return))->response()->setStatusCode(201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to create return: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id): JsonResponse
    {
        $return = SaleReturn::with(['sale', 'product', 'user'])->findOrFail($id);
        return (new SaleReturnResource($return))->response()->setStatusCode(200);
    }

    /**
     * Update the specified resource in storage.
     * Currently only allow status changes (e.g., to reject a pending return).
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $return = SaleReturn::findOrFail($id);

        $validated = $request->validate([
            'status' => ['sometimes', Rule::in(['pending', 'completed', 'rejected'])],
            'reason' => 'nullable|string|max:500',
        ]);

        // If status is being changed to 'completed' and was previously not completed,
        // we may need to adjust stock and refund. For simplicity, allow only status to be changed to 'rejected' or stay same.
        $oldStatus = $return->status;
        $newStatus = $validated['status'] ?? $oldStatus;

        if ($newStatus !== $oldStatus) {
            DB::beginTransaction();
            try {
                if ($oldStatus !== 'completed' && $newStatus === 'completed') {
                    // Completing a pending return: increase stock
                    Product::where('id', $return->product_id)->increment('stock_quantity', $return->quantity);
                } elseif ($oldStatus === 'completed' && $newStatus !== 'completed') {
                    // Reverting a completed return: decrease stock
                    Product::where('id', $return->product_id)->decrement('stock_quantity', $return->quantity);
                }

                $return->update($validated);

                DB::commit();
                return (new SaleReturnResource($return))->response()->setStatusCode(200);
            } catch (\Exception $e) {
                DB::rollBack();
                return response()->json(['message' => 'Failed to update return: ' . $e->getMessage()], 500);
            }
        }

        $return->update($validated);
        return (new SaleReturnResource($return))->response()->setStatusCode(200);
    }

    /**
     * Remove the specified resource from storage.
     * Typically returns should not be deleted, but allow if needed.
     */
    public function destroy(string $id): JsonResponse
    {
        $return = SaleReturn::findOrFail($id);

        // If return was completed, revert stock change
        if ($return->status === 'completed') {
            Product::where('id', $return->product_id)->decrement('stock_quantity', $return->quantity);
        }

        $return->delete();

        return response()->json(null, 204);
    }
}
