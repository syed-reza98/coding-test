<?php

namespace App\Services;

use App\Exceptions\InsufficientStockException;
use App\Models\Customer;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class OrderService
{
    /**
     * Create a new order with atomic stock validation, server-side price calculation,
     * and pessimistic concurrency locking inside a database transaction.
     *
     * @throws InsufficientStockException
     * @throws \Exception
     */
    public function createOrder(int $customerId, int $userId, array $items, ?string $notes = null): Order
    {
        return DB::transaction(function () use ($customerId, $userId, $items, $notes) {
            // Verify customer exists
            Customer::findOrFail($customerId);

            $totalAmount = '0.00';
            $orderItemsToInsert = [];
            $stockErrors = [];

            // Group by product_id in case client sent duplicate items
            $aggregatedQuantities = [];
            foreach ($items as $item) {
                $pid = (int) $item['product_id'];
                $qty = (int) $item['quantity'];
                if ($qty <= 0) {
                    continue;
                }
                $aggregatedQuantities[$pid] = ($aggregatedQuantities[$pid] ?? 0) + $qty;
            }

            if (empty($aggregatedQuantities)) {
                throw new \InvalidArgumentException("Order must contain at least one valid product item.");
            }

            // Lock and validate each product
            foreach ($aggregatedQuantities as $productId => $quantity) {
                /** @var Product $product */
                $product = Product::where('id', $productId)->lockForUpdate()->first();

                if (!$product) {
                    throw new \InvalidArgumentException("Product with ID {$productId} not found.");
                }

                if ($product->status !== 'active') {
                    throw new \InvalidArgumentException("Product '{$product->name}' is currently inactive.");
                }

                if ($product->stock_quantity < $quantity) {
                    $stockErrors[] = [
                        'product_id'         => $product->id,
                        'product_name'       => $product->name,
                        'requested_quantity' => $quantity,
                        'available_stock'    => $product->stock_quantity,
                    ];
                }
            }

            // If any product lacks sufficient stock, abort transaction with 409
            if (!empty($stockErrors)) {
                $firstError = $stockErrors[0];
                throw new InsufficientStockException(
                    "Insufficient stock for product '{$firstError['product_name']}'. Requested: {$firstError['requested_quantity']}, Available: {$firstError['available_stock']}.",
                    $stockErrors
                );
            }

            // Generate unique human-readable order number
            $orderNumber = 'ORD-' . date('Ymd') . '-' . strtoupper(Str::random(5));

            // Create initial order container
            $order = Order::create([
                'order_number' => $orderNumber,
                'customer_id'  => $customerId,
                'user_id'      => $userId,
                'status'       => 'pending',
                'total_amount' => 0.00,
                'notes'        => $notes,
            ]);

            // Deduct stock, calculate line totals, and build item records
            foreach ($aggregatedQuantities as $productId => $quantity) {
                /** @var Product $product */
                $product = Product::find($productId);

                $product->decrement('stock_quantity', $quantity);

                // Line total calculated with exact precision
                $unitPrice = (string) $product->price;
                $lineTotal = bcmul($unitPrice, (string) $quantity, 2);
                $totalAmount = bcadd($totalAmount, $lineTotal, 2);

                $orderItemsToInsert[] = [
                    'order_id'     => $order->id,
                    'product_id'   => $product->id,
                    'product_name' => $product->name,
                    'product_sku'  => $product->sku,
                    'unit_price'   => $unitPrice,
                    'quantity'     => $quantity,
                    'line_total'   => $lineTotal,
                    'created_at'   => now(),
                    'updated_at'   => now(),
                ];
            }

            // Bulk insert order items
            OrderItem::insert($orderItemsToInsert);

            // Update order with verified server-computed total
            $order->update(['total_amount' => $totalAmount]);

            return $order->load(['customer', 'user', 'items.product']);
        });
    }

    /**
     * Cancel an order and safely restore inventory within a database transaction.
     *
     * @throws \Exception
     */
    public function cancelOrder(Order $order): Order
    {
        return DB::transaction(function () use ($order) {
            // Reload order with pessimistic lock
            $lockedOrder = Order::where('id', $order->id)->lockForUpdate()->firstOrFail();

            if ($lockedOrder->status === 'cancelled') {
                throw new \InvalidArgumentException("Order is already cancelled.");
            }

            // Restore product stock for each line item
            foreach ($lockedOrder->items as $item) {
                Product::where('id', $item->product_id)
                    ->increment('stock_quantity', $item->quantity);
            }

            $lockedOrder->update(['status' => 'cancelled']);

            return $lockedOrder->fresh(['customer', 'user', 'items.product']);
        });
    }
}
