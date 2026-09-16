'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { Product, Category, Order } from '@/types';
import { useAuth } from '@/context/AuthContext';
import {
  ShoppingCart,
  Search,
  Plus,
  Minus,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Loader2,
  Shield,
  ArrowRight,
  Package,
  Layers,
  Sparkles,
} from 'lucide-react';

interface CartItem {
  product: Product;
  quantity: number;
}

export default function StorefrontPage() {
  const { user } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [search, setSearch] = useState('');

  // Cart Drawer State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Checkout Modal State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [customerForm, setCustomerForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    notes: '',
  });
  const [checkoutSubmitting, setCheckoutSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [stockConflicts, setStockConflicts] = useState<any[]>([]);

  // Placed Order Success Modal
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);

  // Load products and categories from public storefront endpoints
  const fetchCatalog = async () => {
    setLoadingProducts(true);
    try {
      const params: any = {};
      if (selectedCategory) params.category = selectedCategory;
      if (search) params.search = search;

      const [prodRes, catRes] = await Promise.all([
        api.get('/storefront/products', { params }),
        api.get('/storefront/categories'),
      ]);

      if (prodRes.data.data) setProducts(prodRes.data.data);
      if (catRes.data.data) setCategories(catRes.data.data);
    } catch {
      // Fallback
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, [selectedCategory]);

  // Cart Functions
  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock_quantity) {
          return prev;
        }
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const updateCartQty = (productId: number, qty: number) => {
    if (qty <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((i) => (i.product.id === productId ? { ...i, quantity: qty } : i))
    );
  };

  const removeFromCart = (productId: number) => {
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
  };

  const totalCartCount = useMemo(() => {
    return cart.reduce((sum, i) => sum + i.quantity, 0);
  }, [cart]);

  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  }, [cart]);

  // Handle Checkout Submit
  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutSubmitting(true);
    setCheckoutError(null);
    setStockConflicts([]);

    const payload = {
      name: customerForm.name,
      email: customerForm.email,
      phone: customerForm.phone || undefined,
      address: customerForm.address,
      notes: customerForm.notes || undefined,
      items: cart.map((i) => ({
        product_id: i.product.id,
        quantity: i.quantity,
      })),
    };

    try {
      const response = await api.post('/storefront/orders', payload);
      if (response.data.success) {
        setPlacedOrder(response.data.data);
        setCart([]);
        setIsCheckoutOpen(false);
        setIsCartOpen(false);
        // Refresh catalog to reflect new real-time stock
        fetchCatalog();
      }
    } catch (err: any) {
      // Concurrency Stock Conflict Handling
      if (err.response?.status === 409 && err.response?.data?.error === 'OUT_OF_STOCK') {
        const details = err.response.data.details || [];
        setStockConflicts(details);
        setCheckoutError(
          err.response.data.message ||
            'Inventory conflict detected: Another customer completed checkout for the remaining stock.'
        );
      } else {
        setCheckoutError(err.response?.data?.message || 'Failed to complete order. Please try again.');
      }
    } finally {
      setCheckoutSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Top Banner */}
      <div className="bg-indigo-600 text-white text-xs py-2 px-4 text-center font-medium flex items-center justify-center gap-2">
        <Sparkles className="w-3.5 h-3.5" />
        <span>Live Customer Storefront — Real-time MySQL Concurrency & Order Management Integration</span>
      </div>

      {/* Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
              O
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-slate-900">OrderFlow</span>
              <span className="ml-1 text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">Store</span>
            </div>
          </Link>

          {/* Search Bar */}
          <div className="flex-1 max-w-md hidden md:block">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                fetchCatalog();
              }}
              className="relative"
            >
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products by name or SKU..."
                className="w-full pl-10 pr-4 py-2 bg-slate-100 border border-transparent rounded-full text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 transition-all"
              />
            </form>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3">
            {/* Cart Trigger */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-colors"
            >
              <ShoppingCart className="w-4 h-4 text-slate-700" />
              <span className="hidden sm:inline">Cart</span>
              {totalCartCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                  {totalCartCount}
                </span>
              )}
            </button>

            {/* Staff / Admin Portal Link */}
            {user ? (
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
              >
                <Shield className="w-3.5 h-3.5 text-indigo-400" />
                <span>Open OMS Dashboard</span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
              >
                <Shield className="w-3.5 h-3.5 text-slate-400" />
                <span>Staff Portal</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-white to-slate-50 border-b border-slate-200 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold border border-indigo-100">
            <Package className="w-3.5 h-3.5" /> High-Performance Workspace & Hardware
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Order directly from our catalog
          </h1>
          <p className="text-sm text-slate-500 max-w-xl mx-auto">
            Place orders with live inventory verification. All customer orders synchronize automatically with the staff Order Management System.
          </p>
        </div>
      </section>

      {/* Main Catalog Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold shrink-0 transition-colors ${
              selectedCategory === ''
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            All Products
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.name)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold shrink-0 transition-colors ${
                selectedCategory === c.name
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        {loadingProducts ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          </div>
        ) : products.length === 0 ? (
          <div className="p-16 text-center bg-white rounded-2xl border border-slate-200 text-slate-400">
            No active products found in this category.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((prod) => {
              const isOut = prod.stock_quantity <= 0;
              const cartItem = cart.find((i) => i.product.id === prod.id);

              return (
                <div
                  key={prod.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded">
                        {prod.category}
                      </span>
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          isOut
                            ? 'bg-rose-100 text-rose-700'
                            : prod.stock_quantity <= 5
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {isOut ? 'Out of Stock' : `${prod.stock_quantity} in stock`}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-slate-900 leading-snug">{prod.name}</h3>
                      <p className="text-xs text-slate-400 font-mono mt-1">SKU: {prod.sku}</p>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-400 block">Price</span>
                      <span className="text-lg font-black text-slate-900">${prod.price.toFixed(2)}</span>
                    </div>

                    <button
                      type="button"
                      disabled={isOut || (cartItem && cartItem.quantity >= prod.stock_quantity)}
                      onClick={() => addToCart(prod)}
                      className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:pointer-events-none text-white rounded-lg text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      {cartItem ? `In Cart (${cartItem.quantity})` : 'Add to Cart'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Slide-over Shopping Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsCartOpen(false)}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
              {/* Header */}
              <div className="p-5 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-bold text-base text-slate-900">Your Cart ({totalCartCount})</h3>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Items */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 divide-y divide-slate-100">
                {cart.length === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center text-slate-400 space-y-2">
                    <ShoppingCart className="w-10 h-10 stroke-1" />
                    <p className="text-sm font-medium">Your shopping cart is empty.</p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div key={item.product.id} className="pt-4 first:pt-0 flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">{item.product.name}</p>
                        <p className="text-xs text-slate-400">${item.product.price.toFixed(2)} each</p>
                        <p className="text-[11px] text-amber-600 font-medium">
                          {item.product.stock_quantity} available in warehouse
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50">
                          <button
                            onClick={() => updateCartQty(item.product.id, item.quantity - 1)}
                            className="p-1 text-slate-600 hover:bg-slate-200 rounded-l"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="px-2.5 text-xs font-bold text-slate-800">{item.quantity}</span>
                          <button
                            disabled={item.quantity >= item.product.stock_quantity}
                            onClick={() => updateCartQty(item.product.id, item.quantity + 1)}
                            className="p-1 text-slate-600 hover:bg-slate-200 rounded-r disabled:opacity-30"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="p-1 text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Drawer Footer */}
              {cart.length > 0 && (
                <div className="p-5 border-t border-slate-200 bg-slate-50 space-y-3">
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm font-semibold text-slate-600">Subtotal</span>
                    <span className="text-xl font-black text-slate-900">${cartSubtotal.toFixed(2)}</span>
                  </div>
                  <button
                    onClick={() => {
                      setIsCartOpen(false);
                      setIsCheckoutOpen(true);
                    }}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all"
                  >
                    <span>Proceed to Checkout</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Customer Checkout Modal */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Customer Checkout</h3>
              <button onClick={() => setIsCheckoutOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error / Concurrency Conflict Notice */}
            {checkoutError && (
              <div className="mt-4 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs space-y-1.5">
                <div className="flex items-center gap-2 font-bold">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Order Placement Notice</span>
                </div>
                <p>{checkoutError}</p>
                {stockConflicts.length > 0 && (
                  <ul className="list-disc list-inside mt-1">
                    {stockConflicts.map((c) => (
                      <li key={c.product_id}>
                        {c.product_name}: Requested {c.requested_quantity}, only {c.available_stock} remaining!
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <form onSubmit={handleCheckoutSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={customerForm.name}
                  onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                  placeholder="e.g. Alice Walker"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={customerForm.email}
                    onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                    placeholder="alice@example.com"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={customerForm.phone}
                    onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Shipping Address *</label>
                <textarea
                  rows={2}
                  required
                  value={customerForm.address}
                  onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })}
                  placeholder="Street, City, State, ZIP..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Special Delivery Remarks</label>
                <input
                  type="text"
                  value={customerForm.notes}
                  onChange={(e) => setCustomerForm({ ...customerForm, notes: e.target.value })}
                  placeholder="e.g. Leave by side gate"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Summary box */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>Order Items:</span>
                  <span className="font-semibold text-slate-900">{totalCartCount} items</span>
                </div>
                <div className="flex justify-between text-slate-900 font-bold text-sm pt-1 border-t border-slate-200">
                  <span>Total Due:</span>
                  <span className="text-indigo-600 font-black">${cartSubtotal.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCheckoutOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Back to Cart
                </button>
                <button
                  type="submit"
                  disabled={checkoutSubmitting || cart.length === 0}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {checkoutSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Confirm & Place Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Placed Order Success Modal */}
      {placedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-8 text-center space-y-5 shadow-2xl border border-slate-200">
            <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-xl font-black text-slate-900">Order Confirmed!</h3>
              <p className="text-xs text-slate-500 mt-1">
                Thank you for your purchase. Your order has been placed into the fulfillment system.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Order ID:</span>
                <span className="font-mono font-bold text-indigo-600">{placedOrder.order_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Billed:</span>
                <span className="font-bold text-slate-900">${placedOrder.total_amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Customer:</span>
                <span className="font-medium text-slate-800">{placedOrder.customer?.name}</span>
              </div>
            </div>

            <button
              onClick={() => setPlacedOrder(null)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
