'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { DashboardData } from '@/types';
import { Navbar } from '@/components/Navbar';
import {
  Users,
  Package,
  ShoppingCart,
  DollarSign,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Loader2,
  RefreshCw,
} from 'lucide-react';

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/dashboard');
      if (response.data.success) {
        setData(response.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  return (
    <div className="flex-1 flex flex-col">
      <Navbar title="Dashboard Overview" subtitle="System metrics, inventory health, and recent orders" />

      <div className="p-8 space-y-8">
        {/* Top Controls */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">Live operational snapshot</p>
          <button
            onClick={fetchDashboard}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button onClick={fetchDashboard} className="underline font-semibold ml-4">
              Try Again
            </button>
          </div>
        )}

        {loading && !data ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          </div>
        ) : (
          data && (
            <>
              {/* Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
                {/* Total Sales */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Sales</span>
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <DollarSign className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-2xl font-bold text-slate-900">
                      ${data.metrics.total_sales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">Verified revenue</p>
                  </div>
                </div>

                {/* Total Orders */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Orders</span>
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                      <ShoppingCart className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-2xl font-bold text-slate-900">{data.metrics.total_orders}</h3>
                    <Link href="/orders" className="text-xs text-indigo-600 hover:underline mt-1 inline-flex items-center gap-1">
                      View all orders <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>

                {/* Total Products */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Products</span>
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <Package className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-2xl font-bold text-slate-900">{data.metrics.total_products}</h3>
                    <Link href="/products" className="text-xs text-indigo-600 hover:underline mt-1 inline-flex items-center gap-1">
                      Manage inventory <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>

                {/* Total Customers */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Customers</span>
                    <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                      <Users className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-2xl font-bold text-slate-900">{data.metrics.total_customers}</h3>
                    <Link href="/customers" className="text-xs text-indigo-600 hover:underline mt-1 inline-flex items-center gap-1">
                      Client directory <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>

                {/* Low-stock Products */}
                <div className={`p-5 rounded-xl border shadow-sm flex flex-col justify-between ${
                  data.metrics.low_stock_count > 0
                    ? 'bg-amber-50/50 border-amber-200'
                    : 'bg-white border-slate-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider">Low Stock Alert</span>
                    <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-2xl font-bold text-amber-900">{data.metrics.low_stock_count}</h3>
                    <p className="text-xs text-amber-700 mt-1">≤ 5 units remaining</p>
                  </div>
                </div>
              </div>

              {/* Two Column Section: Low Stock Warning & Recent Orders */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Low Stock Table */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                  <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <h4 className="font-semibold text-sm text-slate-900">Low Stock Inventory</h4>
                    </div>
                    <Link href="/products?low_stock=true" className="text-xs font-medium text-indigo-600 hover:underline">
                      View all
                    </Link>
                  </div>

                  <div className="divide-y divide-slate-100 flex-1">
                    {data.low_stock_products.length === 0 ? (
                      <div className="p-8 text-center text-sm text-slate-400">
                        All products have healthy inventory levels.
                      </div>
                    ) : (
                      data.low_stock_products.map((prod) => (
                        <div key={prod.id} className="px-6 py-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{prod.name}</p>
                            <p className="text-xs text-slate-400">SKU: {prod.sku} • {prod.category}</p>
                          </div>
                          <div className="text-right">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              {prod.stock_quantity} left
                            </span>
                            <p className="text-xs text-slate-500 mt-0.5">${prod.price.toFixed(2)}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Recent Orders */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                  <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="w-4 h-4 text-indigo-600" />
                      <h4 className="font-semibold text-sm text-slate-900">Recent Orders</h4>
                    </div>
                    <Link href="/orders" className="text-xs font-medium text-indigo-600 hover:underline">
                      View all orders
                    </Link>
                  </div>

                  <div className="divide-y divide-slate-100 flex-1">
                    {data.recent_orders.length === 0 ? (
                      <div className="p-8 text-center text-sm text-slate-400">
                        No orders recorded yet.
                      </div>
                    ) : (
                      data.recent_orders.map((ord) => (
                        <div key={ord.id} className="px-6 py-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{ord.order_number}</p>
                            <p className="text-xs text-slate-500">{ord.customer?.name || 'Customer'}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-slate-900">${ord.total_amount.toFixed(2)}</p>
                            <span className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                              ord.status === 'completed'
                                ? 'bg-emerald-100 text-emerald-800'
                                : ord.status === 'processing'
                                ? 'bg-blue-100 text-blue-800'
                                : ord.status === 'cancelled'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {ord.status}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Bonus: Sales Activity by Date */}
              {data.sales_chart && data.sales_chart.length > 0 && (
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-4 h-4 text-indigo-600" />
                    <h4 className="font-semibold text-sm text-slate-900">Recent Sales Activity</h4>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                    {data.sales_chart.map((s) => (
                      <div key={s.date} className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-center">
                        <p className="text-[11px] font-semibold text-slate-500">{s.date}</p>
                        <p className="text-base font-bold text-indigo-600 mt-1">${parseFloat(s.total).toFixed(2)}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{s.count} {s.count === 1 ? 'order' : 'orders'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )
        )}
      </div>
    </div>
  );
}
