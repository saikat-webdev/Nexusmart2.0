<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Coupon;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;

class CouponController extends Controller
{
    /**
     * Display a listing of all coupons
     */
    public function index(Request $request): JsonResponse
    {
        $perPage = $request->input('per_page', 25);
        $coupons = Coupon::paginate($perPage);
        return response()->json($coupons);
    }

    /**
     * Store a newly created coupon
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => 'required|string|unique:coupons,code',
            'description' => 'nullable|string',
            'discount_type' => 'required|in:fixed,percentage',
            'discount_value' => 'required|numeric|min:0',
            'usage_limit' => 'nullable|integer|min:0',
            'valid_from' => 'nullable|date_format:Y-m-d H:i:s',
            'valid_until' => 'nullable|date_format:Y-m-d H:i:s',
            'min_order_amount' => 'nullable|numeric|min:0',
            'is_active' => 'boolean',
        ]);

        $coupon = Coupon::create($validated);

        return response()->json([
            'message' => 'Coupon created successfully',
            'coupon' => $coupon,
        ], 201);
    }

    /**
     * Display the specified coupon
     */
    public function show(Coupon $coupon): JsonResponse
    {
        return response()->json($coupon);
    }

    /**
     * Update the specified coupon
     */
    public function update(Request $request, Coupon $coupon): JsonResponse
    {
        $validated = $request->validate([
            'code' => 'sometimes|required|string|unique:coupons,code,' . $coupon->id,
            'description' => 'nullable|string',
            'discount_type' => 'sometimes|required|in:fixed,percentage',
            'discount_value' => 'sometimes|required|numeric|min:0',
            'usage_limit' => 'nullable|integer|min:0',
            'valid_from' => 'nullable|date_format:Y-m-d H:i:s',
            'valid_until' => 'nullable|date_format:Y-m-d H:i:s',
            'min_order_amount' => 'nullable|numeric|min:0',
            'is_active' => 'boolean',
        ]);

        $coupon->update($validated);

        return response()->json([
            'message' => 'Coupon updated successfully',
            'coupon' => $coupon,
        ]);
    }

    /**
     * Validate a coupon for a given order amount
     * POST /api/coupons/validate
     */
    public function validate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => 'required|string',
            'order_amount' => 'required|numeric|min:0',
        ]);

        $coupon = Coupon::where('code', strtoupper($validated['code']))->first();

        if (!$coupon) {
            return response()->json([
                'valid' => false,
                'message' => 'Coupon not found',
            ], 404);
        }

        if (!$coupon->isValid()) {
            return response()->json([
                'valid' => false,
                'message' => 'Coupon is expired or inactive',
            ], 422);
        }

        if (!$coupon->meetsMinimumAmount($validated['order_amount'])) {
            return response()->json([
                'valid' => false,
                'message' => "Minimum order amount of ₦" . number_format($coupon->min_order_amount, 2) . " required",
            ], 422);
        }

        $discount = $coupon->calculateDiscount($validated['order_amount']);

        return response()->json([
            'valid' => true,
            'coupon' => $coupon,
            'discount' => $discount,
            'message' => 'Coupon is valid',
        ]);
    }
}
