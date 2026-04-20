<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use App\Http\Resources\ProductResource;

class ProductController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\JsonResponse
     */
     public function index(Request $request): JsonResponse
     {
         $perPage = $request->input('per_page', 20);
         
         $query = Product::with(['category', 'supplier']);
         
         if (!$request->has('include_inactive')) {
             $query->where('is_active', true);
         }
         
         $search = $request->input('search');
         $category = $request->input('category');
         
         if ($search) {
             $query->where(function($q) use ($search) {
                 $q->where('name', 'LIKE', "%{$search}%")
                   ->orWhere('sku', 'LIKE', "%{$search}%")
                   ->orWhere('barcode', 'LIKE', "%{$search}%");
             });
         }
         
         if ($category && $category !== 'all') {
             $categoryId = is_numeric($category) ? intval($category) : null;
             if ($categoryId) {
                 $query->where('category_id', $categoryId);
             }
         }
         
         $products = $query->paginate($perPage);
         
         return response()->json(ProductResource::collection($products), 200);
     }

     /**
      * Export products to CSV
      */
     public function export(Request $request)
     {
         $query = Product::with(['category', 'supplier']);
         
         if (!$request->has('include_inactive')) {
             $query->where('is_active', true);
         }
         
         $search = $request->input('search');
         $category = $request->input('category');
         
         if ($search) {
             $query->where(function($q) use ($search) {
                 $q->where('name', 'LIKE', "%{$search}%")
                   ->orWhere('sku', 'LIKE', "%{$search}%")
                   ->orWhere('barcode', 'LIKE', "%{$search}%");
             });
         }
         
         if ($category && $category !== 'all') {
             $categoryId = is_numeric($category) ? intval($category) : null;
             if ($categoryId) {
                 $query->where('category_id', $categoryId);
             }
         }
         
         $products = $query->orderBy('name', 'asc')->get();
         
         $filename = 'products_' . now()->format('Ymd_His') . '.csv';
         $headers = [
             'Content-Type' => 'text/csv; charset=UTF-8',
             'Content-Disposition' => "attachment; filename=\"$filename\"",
         ];
         
         $callback = function() use ($products) {
             $file = fopen('php://output', 'w');
             // UTF-8 BOM for Excel
             fprintf($file, chr(0xEF).chr(0xBB).chr(0xBF));
             fputcsv($file, ['ID', 'Name', 'SKU', 'Barcode', 'Category', 'Supplier', 'Price', 'Stock Qty', 'Reorder Level', 'Status']);
             
             foreach ($products as $product) {
                 fputcsv($file, [
                     $product->id,
                     $product->name,
                     $product->sku,
                     $product->barcode ?? '',
                     optional($product->category)->name ?? 'N/A',
                     optional($product->supplier)->name ?? 'N/A',
                     number_format($product->price, 2, '.', ''),
                     $product->stock_quantity,
                     $product->reorder_level,
                     $product->is_active ? 'Active' : 'Inactive',
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
         $product = Product::with(['category', 'supplier'])->findOrFail($id);
         return (new ProductResource($product))->response()->setStatusCode(200);
     }

    /**
     * Store a newly created resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        // Basic validation (can be moved to Form Requests for better organization)
         $request->validate([
             'name' => 'required|string|max:255',
             'sku' => 'required|string|unique:products|max:50',
             'price' => 'required|numeric|min:0',
             'stock_quantity' => 'required|integer|min:0',
             'reorder_level' => 'nullable|integer|min:0',
             'description' => 'nullable|string',
             'is_active' => 'boolean',
             'supplier_id' => 'nullable|integer|exists:suppliers,id',
         ]);

        $productData = $request->all();
        if (!isset($productData['is_active'])) {
            $productData['is_active'] = true;
        }

        $product = Product::create($productData);

        Cache::forget('products.list.*');
        Cache::forget('dashboard.stats');
        Cache::forget('dashboard.low_stock');

        return (new ProductResource($product))->response()->setStatusCode(201);
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $product = Product::findOrFail($id);

        // Validation for update. SKU should not be validated for uniqueness if it's the same SKU.
         $request->validate([
             'name' => 'sometimes|required|string|max:255',
             'sku' => 'sometimes|required|string|max:50|unique:products,sku,' . $product->id,
             'price' => 'sometimes|required|numeric|min:0',
             'stock_quantity' => 'sometimes|required|integer|min:0',
             'description' => 'nullable|string',
             'is_active' => 'boolean',
             'supplier_id' => 'nullable|integer|exists:suppliers,id',
         ]);

        $product->update($request->all());
        
        // Clear relevant caches when product is updated
        Cache::forget('products.list.*');
        Cache::forget('dashboard.stats');
        Cache::forget('dashboard.low_stock');

        return (new ProductResource($product))->response()->setStatusCode(200);
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy(int $id): JsonResponse
    {
        $product = Product::findOrFail($id);
        // Check if product is in any active sales before deleting safely
        if ($product->saleItems()->count() > 0) {
            // Optionally disable instead of deleting for history
            // $product->is_active = false;
            // $product->save();
            // return response()->json(['message' => 'Product disabled instead of deleted due to existing sales.'], 200);

            // Or simply return an error
            return response()->json(['message' => 'Cannot delete product with existing sales history.'], 409); // Conflict
        }
        $product->delete();
        
        Cache::forget('products.list.*');
        Cache::forget('dashboard.stats');
        Cache::forget('dashboard.low_stock');
        
        return response()->json(null, 204); // No Content
    }

    /**
     * Find product by barcode/SKU for quick POS lookup
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function findByBarcode(Request $request): JsonResponse
    {
        $code = $request->input('code');
        
        if (!$code) {
            return response()->json(['message' => 'Barcode/SKU code is required'], 400);
        }

         $product = Product::with(['category', 'supplier'])
             ->where(function($query) use ($code) {
                 $query->where('barcode', $code)
                       ->orWhere('sku', $code)
                       ->orWhere('id', $code);
             })
             ->first();

        if (!$product) {
            return response()->json(['message' => 'Product not found'], 404);
        }

        return (new ProductResource($product))->response()->setStatusCode(200);
    }
}