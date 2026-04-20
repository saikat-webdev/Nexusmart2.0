<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\SaleController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\SettingController;
use App\Http\Controllers\Api\CouponController;
use App\Http\Controllers\Api\SupplierController;
use App\Http\Controllers\Api\SaleReturnController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// --- Public Authentication Routes ---
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// --- Protected Routes (Require Authentication) ---
Route::middleware('auth:sanctum')->group(function () {
    // Auth routes
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
    
    // Dashboard
    Route::get('/dashboard/stats', [DashboardController::class, 'stats']);
    Route::get('/dashboard/low-stock', [DashboardController::class, 'lowStock']);
});

 // --- Product Routes (Public for POS) ---
 Route::apiResource('products', ProductController::class);
 Route::post('/products/find-by-barcode', [ProductController::class, 'findByBarcode']);
 Route::get('/products/export', [ProductController::class, 'export']);

// --- Settings Routes ---
Route::get('/settings', [SettingController::class, 'index']);
Route::get('/settings/{key}', [SettingController::class, 'show']);
Route::post('/settings', [SettingController::class, 'update']);

// --- Category Routes ---
Route::apiResource('categories', CategoryController::class);

 // --- Customer Routes ---
 Route::apiResource('customers', CustomerController::class);
 Route::get('/customers/export', [CustomerController::class, 'export']);

 // --- Sale Routes ---
 Route::apiResource('sales', SaleController::class);
 Route::get('/sales/export', [SaleController::class, 'export']);

 // --- Sale Return Routes ---
 Route::apiResource('sale-returns', SaleReturnController::class)->middleware('auth:sanctum');
 Route::get('/sale-returns/export', [SaleReturnController::class, 'export']);

 // --- Coupon Routes ---
Route::apiResource('coupons', CouponController::class);
Route::post('/coupons/validate', [CouponController::class, 'validate']);

 // --- Supplier Routes ---
 Route::apiResource('suppliers', SupplierController::class);
 Route::get('/suppliers/export', [SupplierController::class, 'export']);
