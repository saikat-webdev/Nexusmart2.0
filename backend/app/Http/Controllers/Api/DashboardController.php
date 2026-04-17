<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Sale;
use App\Models\Customer;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

class DashboardController extends Controller
{
    /**
     * Get dashboard statistics
     */
    public function stats(Request $request)
    {
        // Cache dashboard stats for 5 minutes to avoid repeated heavy queries
        $stats = Cache::remember('dashboard.stats', 300, function () {
            $today = now()->startOfDay();
            $thisMonth = now()->startOfMonth();
            $sevenDaysAgo = now()->subDays(7)->startOfDay();

            // Combine today and month statistics into single queries
            $todayStats = Sale::where('sale_datetime', '>=', $today)
                ->select(DB::raw('SUM(total_amount) as sales, COUNT(*) as count'))
                ->first();
            
            $monthStats = Sale::where('sale_datetime', '>=', $thisMonth)
                ->select(DB::raw('SUM(total_amount) as sales, COUNT(*) as count'))
                ->first();

            // Get all counts in a single query using raw SQL
            $totals = DB::table('products')
                ->select(
                    DB::raw('COUNT(*) as total_products'),
                    DB::raw('SUM(CASE WHEN stock_quantity <= reorder_level THEN 1 ELSE 0 END) as low_stock_products')
                )
                ->first();
            
            $totalCustomers = Customer::count();

            // Recent sales with eager loading (limit to 10)
            $recentSales = Sale::with(['user:id,name', 'customer:id,name', 'saleItems.product:id,name,price'])
                ->orderBy('sale_datetime', 'desc')
                ->limit(10)
                ->get();

            // Top selling products
            $topProducts = DB::table('sale_items')
                ->join('products', 'sale_items.product_id', '=', 'products.id')
                ->select('products.id', 'products.name', DB::raw('SUM(sale_items.quantity) as total_sold'))
                ->groupBy('products.id', 'products.name')
                ->orderBy('total_sold', 'desc')
                ->limit(10)
                ->get();

            // Sales trend (last 7 days)
            $salesTrend = Sale::where('sale_datetime', '>=', $sevenDaysAgo)
                ->select(DB::raw('DATE(sale_datetime) as date'), DB::raw('SUM(total_amount) as total'))
                ->groupBy('date')
                ->orderBy('date', 'asc')
                ->get();

            return [
                'today' => [
                    'sales' => (float)($todayStats->sales ?? 0),
                    'count' => (int)($todayStats->count ?? 0),
                ],
                'month' => [
                    'sales' => (float)($monthStats->sales ?? 0),
                    'count' => (int)($monthStats->count ?? 0),
                ],
                'totals' => [
                    'products' => (int)($totals->total_products ?? 0),
                    'customers' => $totalCustomers,
                    'low_stock_products' => (int)($totals->low_stock_products ?? 0),
                ],
                'recent_sales' => $recentSales,
                'top_products' => $topProducts,
                'sales_trend' => $salesTrend,
            ];
        });

        return response()->json($stats);
    }

    /**
     * Get low stock products
     */
    public function lowStock()
    {
        // Cache low stock products for 10 minutes
        $products = Cache::remember('dashboard.low_stock', 600, function () {
            return Product::whereColumn('stock_quantity', '<=', 'reorder_level')
                ->with('category')
                ->orderBy('stock_quantity', 'asc')
                ->get();
        });

        return response()->json(['data' => $products]);
    }
}
