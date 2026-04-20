<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Supplier;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Http\Resources\SupplierResource;

class SupplierController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $perPage = $request->input('per_page', 20);
        $search = $request->input('search');
        $isActive = $request->input('is_active');

        $query = Supplier::query();

        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('name', 'LIKE', "%{$search}%")
                  ->orWhere('contact_person', 'LIKE', "%{$search}%")
                  ->orWhere('email', 'LIKE', "%{$search}%")
                  ->orWhere('phone', 'LIKE', "%{$search}%");
            });
        }

        if ($isActive !== null) {
            $query->where('is_active', filter_var($isActive, FILTER_VALIDATE_BOOLEAN));
        }

         $suppliers = $query->orderBy('name', 'asc')->paginate($perPage);

         return SupplierResource::collection($suppliers);
     }

     /**
      * Export suppliers to CSV
      */
     public function export(Request $request)
     {
         $query = Supplier::query();

         $search = $request->input('search');
         if ($search) {
             $query->where(function($q) use ($search) {
                 $q->where('name', 'LIKE', "%{$search}%")
                   ->orWhere('contact_person', 'LIKE', "%{$search}%")
                   ->orWhere('email', 'LIKE', "%{$search}%")
                   ->orWhere('phone', 'LIKE', "%{$search}%");
             });
         }

         if ($request->has('is_active')) {
             $query->where('is_active', filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN));
         }

         $suppliers = $query->orderBy('name', 'asc')->get();

         $filename = 'suppliers_' . now()->format('Ymd_His') . '.csv';
         $headers = [
             'Content-Type' => 'text/csv; charset=UTF-8',
             'Content-Disposition' => "attachment; filename=\"$filename\"",
         ];

         $callback = function() use ($suppliers) {
             $file = fopen('php://output', 'w');
             fprintf($file, chr(0xEF).chr(0xBB).chr(0xBF));
             fputcsv($file, ['ID', 'Name', 'Contact Person', 'Email', 'Phone', 'Address', 'Tax ID', 'Notes', 'Status']);
             foreach ($suppliers as $supplier) {
                 fputcsv($file, [
                     $supplier->id,
                     $supplier->name,
                     $supplier->contact_person ?? '',
                     $supplier->email ?? '',
                     $supplier->phone ?? '',
                     $supplier->address ?? '',
                     $supplier->tax_id ?? '',
                     $supplier->notes ?? '',
                     $supplier->is_active ? 'Active' : 'Inactive',
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
            'name' => 'required|string|max:255',
            'contact_person' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255|unique:suppliers,email',
            'address' => 'nullable|string',
            'tax_id' => 'nullable|string|max:50|unique:suppliers,tax_id',
            'notes' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        if (!isset($validated['is_active'])) {
            $validated['is_active'] = true;
        }

        $supplier = Supplier::create($validated);

        return (new SupplierResource($supplier))->response()->setStatusCode(201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Supplier $supplier): JsonResponse
    {
        $supplier->load('products');
        return (new SupplierResource($supplier))->response()->setStatusCode(200);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Supplier $supplier): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'contact_person' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255|unique:suppliers,email,' . $supplier->id,
            'address' => 'nullable|string',
            'tax_id' => 'nullable|string|max:50|unique:suppliers,tax_id,' . $supplier->id,
            'notes' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $supplier->update($validated);

        return (new SupplierResource($supplier))->response()->setStatusCode(200);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Supplier $supplier): JsonResponse
    {
        // Check if supplier has products
        if ($supplier->products()->count() > 0) {
            return response()->json([
                'message' => 'Cannot delete supplier with associated products. Deactivate instead.'
            ], 409);
        }

        $supplier->delete();

        return response()->json(null, 204);
    }
}
