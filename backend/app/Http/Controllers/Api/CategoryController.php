<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Http\Resources\CategoryResource;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Cache;

class CategoryController extends Controller
{
    /**
     * Display a listing of categories.
     */
    public function index()
    {
        // Cache categories for 2 hours - very stable data
        $categories = Cache::remember('categories.list', 7200, function () {
            return Category::withCount('products')->get();
        });
        return CategoryResource::collection($categories);
    }

    /**
     * Store a newly created category.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:categories',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $category = Category::create([
            'name' => $request->name,
            'slug' => Str::slug($request->name),
            'description' => $request->description,
            'is_active' => $request->is_active ?? true,
        ]);
        
        // Clear cache when new category is added
        Cache::forget('categories.list');
        Cache::forget('products.list.*');

        return new CategoryResource($category);
    }

    /**
     * Display the specified category.
     */
    public function show(Category $category)
    {
        $category->load('products');
        return new CategoryResource($category);
    }

    /**
     * Update the specified category.
     */
    public function update(Request $request, Category $category)
    {
        $request->validate([
            'name' => 'string|max:255|unique:categories,name,' . $category->id,
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $data = $request->only(['name', 'description', 'is_active']);
        if ($request->has('name')) {
            $data['slug'] = Str::slug($request->name);
        }

        $category->update($data);
        
        // Clear cache when category is updated
        Cache::forget('categories.list');
        Cache::forget('products.list.*');

        return new CategoryResource($category);
    }

    /**
     * Remove the specified category.
     */
    public function destroy(Category $category)
    {
        $category->delete();
        
        // Clear cache when category is deleted
        Cache::forget('categories.list');
        Cache::forget('products.list.*');
        
        return response()->json(['message' => 'Category deleted successfully']);
    }
}
