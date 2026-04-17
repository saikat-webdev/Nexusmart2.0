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
        
        $query = Product::with('category');
        
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
     * Display the specified resource.
     *
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function show(int $id): JsonResponse
    {
        $product = Product::findOrFail($id);
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
}