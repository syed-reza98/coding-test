<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Http\Resources\ProductResource;
use App\Models\Customer;
use App\Models\Order;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index(): JsonResponse
    {
        $totalCustomers = Customer::count();
        $totalProducts = Product::count();
        $totalOrders = Order::count();

        // Total sales from non-cancelled orders
        $totalSales = (float) Order::where('status', '!=', 'cancelled')->sum('total_amount');

        // Low stock products (stock <= 5)
        $lowStockQuery = Product::query()->lowStock(5)->where('status', 'active');
        $lowStockCount = $lowStockQuery->count();
        $lowStockProducts = $lowStockQuery->take(10)->get();

        // Recent 5 orders
        $recentOrders = Order::with(['customer', 'user'])
            ->latest()
            ->take(5)
            ->get();

        // Sales trend (last 7 days grouped by date)
        $salesChart = Order::where('status', '!=', 'cancelled')
            ->where('created_at', '>=', now()->subDays(30))
            ->select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('SUM(total_amount) as total'),
                DB::raw('COUNT(id) as count')
            )
            ->groupBy(DB::raw('DATE(created_at)'))
            ->orderBy('date', 'asc')
            ->get();

        return response()->json([
            'success' => true,
            'data'    => [
                'metrics' => [
                    'total_customers'  => $totalCustomers,
                    'total_products'   => $totalProducts,
                    'total_orders'     => $totalOrders,
                    'total_sales'      => $totalSales,
                    'low_stock_count'  => $lowStockCount,
                ],
                'low_stock_products' => ProductResource::collection($lowStockProducts),
                'recent_orders'      => OrderResource::collection($recentOrders),
                'sales_chart'        => $salesChart,
            ],
        ]);
    }
}
