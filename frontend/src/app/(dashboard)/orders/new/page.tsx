'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Customer, Product } from '@/types';
import { Navbar } from '@/components/Navbar';
import {
  ShoppingCart,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  ArrowLeft,
  DollarSign,
  Package,
} from 'lucide-react';
import Link from 'next/link';

interface SelectedItem {
  productId: number;
  product: Product;
  quantity: number;
  error?: string;
}

export default function NewOrderPage() {
  const router = useRouter();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [orderItems, setOrderItems] = useState<SelectedItem[]>([]);
  const [notes, setNotes] = useState('');

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [stockConflicts, setStockConflicts] = useState<any[]>([]);

  // Load initial customers and products
  useEffect(() => {
    const initData = async () => {
      setLoadingData(true);
      try {
        const [custRes, prodRes] = await Promise.all([
          api.get('/customers', { params: { per_page: 100 } }),
          api.get('/products', { params: { per_page: 100, status: 'active' } }),
        ]);

        if (custRes.data.data) setCustomers(custRes.data.data);
        if (prodRes.data.data) setProducts(prodRes.data.data);
      } catch (err: any) {
        setFeedback({ type: 'error', message: 'Failed to load customers or catalog.' });
      } finally {
        setLoadingData(false);
      }
    };

    initData();
  }, []);

  // Add Product to Order
  const addProductToOrder = (productId: number) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    // Check if already in order
    const existingIndex = orderItems.findIndex((item) => item.productId === productId);
    if (existingIndex > -1) {
      // Increment quantity
      const updated = [...orderItems];
      if (updated[existingIndex].quantity < prod.stock_quantity) {
        updated[existingIndex].quantity += 1;
        setOrderItems(updated);
      }
    } else {
      if (prod.stock_quantity <= 0) {
        alert('This product currently has zero available stock.');
        return;
      }
      setOrderItems([...orderItems, { productId: prod.id, product: prod, quantity: 1 }]);
    }
  };

  // Remove Item
  const removeItem = (productId: number) => {
    setOrderItems(orderItems.filter((i) => i.productId !== productId));
    setStockConflicts(stockConflicts.filter((c) => c.product_id !== productId));
  };

  // Update Quantity
  const updateQuantity = (productId: number, qty: number) => {
    if (qty <= 0) {
      removeItem(productId);
      return;
    }

    setOrderItems(
      orderItems.map((item) => {
        if (item.productId === productId) {
          return { ...item, quantity: qty, error: undefined };
        }
        return item;
      })
    );
  };

  // Calculated Order Total (Strictly matches client side preview)
  const orderTotal = useMemo(() => {
    return orderItems.reduce((sum, item) => {
      return sum + item.product.price * item.quantity;
    }, 0);
  }, [orderItems]);

  // Submit Order
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCustomerId) {
      setFeedback({ type: 'error', message: 'Please select a customer for this order.' });
      return;
    }

    if (orderItems.length === 0) {
      setFeedback({ type: 'error', message: 'Please add at least one product to the order.' });
      return;
    }

    setSubmitting(true);
    setFeedback(null);
    setStockConflicts([]);

    const payload = {
      customer_id: parseInt(selectedCustomerId, 10),
      items: orderItems.map((i) => ({
        product_id: i.productId,
        quantity: i.quantity,
      })),
      notes: notes || undefined,
    };

    try {
      const response = await api.post('/orders', payload);
      if (response.data.success) {
        setFeedback({
          type: 'success',
          message: `Order ${response.data.data.order_number} created successfully! Verified total: $${response.data.data.total_amount.toFixed(2)}`,
        });

        // Reset items
        setOrderItems([]);
        setNotes('');

        // Redirect after brief delay
        setTimeout(() => {
          router.push(`/orders/${response.data.data.id}`);
        }, 1200);
      }
    } catch (err: any) {
      // Concurrency & Stockout Error Handling (Part A & Technical Question)
      if (err.response?.status === 409 && err.response?.data?.error === 'OUT_OF_STOCK') {
        const details = err.response.data.details || [];
        setStockConflicts(details);

        // Highlight affected items in the order list
        setOrderItems((prev) =>
          prev.map((item) => {
            const conflict = details.find((c: any) => c.product_id === item.productId);
            if (conflict) {
              return {
                ...item,
                error: `Only ${conflict.available_stock} left in stock!`,
              };
            }
            return item;
          })
        );

        setFeedback({
          type: 'error',
          message:
            err.response.data.message ||
            'Inventory conflict detected: Another customer completed checkout for the remaining stock.',
        });
      } else {
        setFeedback({
          type: 'error',
          message: err.response?.data?.message || 'Failed to place order. Please review your input.',
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <Navbar title="Create New Order" subtitle="Compose customer orders with verified real-time stock" />

      <div className="p-8 space-y-6 max-w-6xl">
        <div className="flex items-center justify-between">
          <Link
            href="/orders"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Orders
          </Link>
        </div>

        {/* Global Feedback */}
        {feedback && (
          <div
            className={`p-4 rounded-xl text-sm flex items-center justify-between ${
              feedback.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border border-rose-200 text-rose-800'
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
            <button onClick={() => setFeedback(null)} className="text-xs font-semibold opacity-70 hover:opacity-100">
              Dismiss
            </button>
          </div>
        )}

        {/* Concurrency Out-of-Stock Alert Banner */}
        {stockConflicts.length > 0 && (
          <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-sm space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-800">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Stock Changed During Checkout (Race-Condition Protected)</span>
            </div>
            <p className="text-xs text-amber-700">
              Your form data has been preserved. Please adjust the quantities or remove the unavailable items below:
            </p>
            <ul className="list-disc list-inside text-xs space-y-1">
              {stockConflicts.map((c) => (
                <li key={c.product_id}>
                  <strong>{c.product_name}</strong>: Requested {c.requested_quantity}, but only{' '}
                  <span className="font-bold text-rose-700">{c.available_stock}</span> remaining in stock.
                </li>
              ))}
            </ul>
          </div>
        )}

        {loadingData ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left 2 Cols: Customer & Product Selection */}
            <div className="lg:col-span-2 space-y-6">
              {/* Step 1: Customer Selection */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Step 1: Select Customer
                </label>
                <select
                  required
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- Choose a Customer --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 2: Catalog Quick-Add Table */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Step 2: Add Products to Order
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">Click any product to append or increment</p>
                  </div>
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                  {products.map((prod) => {
                    const isOutOfStock = prod.stock_quantity <= 0;
                    return (
                      <div
                        key={prod.id}
                        className="px-6 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
                      >
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{prod.name}</p>
                          <p className="text-xs text-slate-500 font-mono">{prod.sku} • {prod.category}</p>
                        </div>

                        <div className="flex items-center gap-4">
                          <span className="text-sm font-bold text-slate-800">${prod.price.toFixed(2)}</span>
                          <span
                            className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                              isOutOfStock
                                ? 'bg-rose-100 text-rose-700'
                                : prod.stock_quantity <= 5
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {isOutOfStock ? 'Out of Stock' : `${prod.stock_quantity} available`}
                          </span>

                          <button
                            type="button"
                            disabled={isOutOfStock}
                            onClick={() => addProductToOrder(prod.id)}
                            className="p-1.5 bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-600 rounded-lg transition-colors disabled:opacity-40 disabled:pointer-events-none"
                            title="Add to order"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Step 3: Order Items List */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Step 3: Configured Order Items ({orderItems.length})
                  </h3>
                </div>

                {orderItems.length === 0 ? (
                  <div className="p-8 text-center text-sm text-slate-400">
                    No products added yet. Click &ldquo;+&rdquo; in the catalog above to build your order.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {orderItems.map((item) => (
                      <div
                        key={item.productId}
                        className={`px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                          item.error ? 'bg-rose-50/40 border-l-4 border-rose-500' : ''
                        }`}
                      >
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{item.product.name}</p>
                          <p className="text-xs text-slate-500 font-mono">
                            ${item.product.price.toFixed(2)} each • SKU: {item.product.sku}
                          </p>
                          {item.error && (
                            <p className="text-xs font-semibold text-rose-600 mt-1 flex items-center gap-1">
                              <AlertCircle className="w-3.5 h-3.5" />
                              {item.error}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                              className="px-2.5 py-1 text-slate-600 hover:bg-slate-200 transition-colors font-bold text-sm"
                            >
                              -
                            </button>
                            <span className="px-3 py-1 text-sm font-semibold text-slate-900 bg-white min-w-[32px] text-center">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                              className="px-2.5 py-1 text-slate-600 hover:bg-slate-200 transition-colors font-bold text-sm"
                            >
                              +
                            </button>
                          </div>

                          <div className="text-right w-24">
                            <p className="text-sm font-bold text-slate-900">
                              ${(item.product.price * item.quantity).toFixed(2)}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeItem(item.productId)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                            title="Remove item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right 1 Col: Summary & Checkout */}
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 sticky top-6">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider pb-3 border-b border-slate-100">
                  Order Summary
                </h3>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-slate-600">
                    <span>Distinct Items:</span>
                    <span className="font-semibold text-slate-900">{orderItems.length}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Total Units:</span>
                    <span className="font-semibold text-slate-900">
                      {orderItems.reduce((acc, i) => acc + i.quantity, 0)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Server Verification:</span>
                    <span className="text-emerald-600 font-medium text-xs">Pessimistic Lock Enabled</span>
                  </div>

                  <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline">
                    <span className="text-base font-bold text-slate-900">Estimated Total:</span>
                    <span className="text-2xl font-black text-indigo-600">
                      ${orderTotal.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="pt-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Order Notes / Shipping Remarks
                  </label>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Leave package with front desk..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting || orderItems.length === 0 || !selectedCustomerId}
                  className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Locking & Validating Stock...
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-4 h-4" />
                      Place Order
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
