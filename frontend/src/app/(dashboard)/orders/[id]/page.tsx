'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { Order } from '@/types';
import { Navbar } from '@/components/Navbar';
import {
  Printer,
  ArrowLeft,
  Loader2,
  CheckCircle,
  AlertCircle,
  FileText,
  Building,
  User,
  Calendar,
  DollarSign,
} from 'lucide-react';

export default function OrderInvoicePage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.id;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchOrder = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/orders/${orderId}`);
      if (response.data.success) {
        setOrder(response.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to retrieve order details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  const handleUpdateStatus = async (newStatus: string) => {
    setStatusUpdating(true);
    setFeedback(null);
    try {
      const response = await api.patch(`/orders/${orderId}/status`, { status: newStatus });
      if (response.data.success) {
        setOrder(response.data.data);
        setFeedback({ type: 'success', message: `Order status updated to "${newStatus}".` });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.response?.data?.message || 'Failed to update status.' });
    } finally {
      setStatusUpdating(false);
    }
  };

  const printInvoice = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col">
        <Navbar title="Order Invoice" />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex-1 flex flex-col">
        <Navbar title="Order Invoice" />
        <div className="p-8 max-w-xl mx-auto text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h3 className="text-lg font-bold text-slate-900">Order Not Found</h3>
          <p className="text-sm text-slate-500">{error || 'Unable to load invoice.'}</p>
          <Link
            href="/orders"
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="print:hidden">
        <Navbar title={`Invoice: ${order.order_number}`} subtitle="Official transaction receipt and fulfillment sheet" />
      </div>

      <div className="p-8 space-y-6 max-w-4xl mx-auto w-full">
        {/* Screen-only Controls */}
        <div className="flex items-center justify-between print:hidden">
          <Link
            href="/orders"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Orders
          </Link>

          <div className="flex items-center gap-3">
            {order.status !== 'cancelled' && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">Status:</span>
                <select
                  value={order.status}
                  disabled={statusUpdating}
                  onChange={(e) => handleUpdateStatus(e.target.value)}
                  className="py-1.5 px-3 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 capitalize"
                >
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            )}

            <button
              onClick={printInvoice}
              className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
            >
              <Printer className="w-4 h-4" />
              Print / PDF
            </button>
          </div>
        </div>

        {feedback && (
          <div
            className={`p-3 rounded-xl text-xs print:hidden ${
              feedback.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border border-rose-200 text-rose-800'
            }`}
          >
            {feedback.message}
          </div>
        )}

        {/* Invoice Container (Printable) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-8 sm:p-12 space-y-8 print:shadow-none print:border-none print:p-0">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-8 border-b border-slate-100 gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                  O
                </div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">OrderFlow Systems</h2>
              </div>
              <p className="text-xs text-slate-400 mt-1">Enterprise Order Management & Inventory</p>
            </div>

            <div className="text-left sm:text-right">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">INVOICE</h3>
              <p className="text-sm font-mono font-semibold text-indigo-600 mt-0.5">{order.order_number}</p>
              <p className="text-xs text-slate-400 mt-1">
                Date: {new Date(order.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
              <span
                className={`inline-block mt-2 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                  order.status === 'completed'
                    ? 'bg-emerald-100 text-emerald-800'
                    : order.status === 'processing'
                    ? 'bg-blue-100 text-blue-800'
                    : order.status === 'cancelled'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {order.status}
              </span>
            </div>
          </div>

          {/* Client & Billing Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-sm">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Billed To:</span>
              <p className="font-bold text-slate-900 text-base">{order.customer?.name}</p>
              <p className="text-slate-600 text-xs mt-1">{order.customer?.email}</p>
              {order.customer?.phone && <p className="text-slate-600 text-xs">{order.customer?.phone}</p>}
              {order.customer?.address && (
                <p className="text-slate-500 text-xs mt-2 whitespace-pre-line leading-relaxed">
                  {order.customer?.address}
                </p>
              )}
            </div>

            <div className="sm:text-right">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Order Origin:</span>
              <p className="text-xs text-slate-600">Processed by: <strong className="text-slate-800">{order.user?.name || 'Staff'}</strong></p>
              <p className="text-xs text-slate-500 capitalize">{order.user?.role} Representative</p>
              {order.notes && (
                <div className="mt-4 p-3 bg-slate-50 rounded-lg text-left inline-block border border-slate-100 max-w-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Remarks:</span>
                  <p className="text-xs text-slate-600 mt-0.5">{order.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Items Table */}
          <div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3">Item Description</th>
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4 text-right">Unit Price</th>
                  <th className="py-3 px-4 text-center">Qty</th>
                  <th className="py-3 text-right">Line Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {order.items?.map((item) => (
                  <tr key={item.id}>
                    <td className="py-3.5 font-semibold text-slate-800">{item.product_name}</td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-500">{item.product_sku}</td>
                    <td className="py-3.5 px-4 text-right text-slate-600">${item.unit_price.toFixed(2)}</td>
                    <td className="py-3.5 px-4 text-center text-slate-700 font-medium">{item.quantity}</td>
                    <td className="py-3.5 text-right font-bold text-slate-900">${item.line_total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Total Calculation */}
          <div className="border-t-2 border-slate-200 pt-6 flex justify-end">
            <div className="w-64 space-y-2 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-semibold text-slate-900">${order.total_amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Tax (0.00%):</span>
                <span className="font-semibold text-slate-900">$0.00</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
                <span className="font-bold text-slate-900 text-base">Grand Total:</span>
                <span className="font-black text-2xl text-indigo-600">
                  ${order.total_amount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-8 border-t border-slate-100 text-center text-xs text-slate-400">
            <p>Thank you for doing business with OrderFlow. Questions? Contact support@orderflow.internal.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
