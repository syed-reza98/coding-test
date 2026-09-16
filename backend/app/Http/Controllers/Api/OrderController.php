<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Order\StoreOrderRequest;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Services\OrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class OrderController extends Controller
{
    public function __construct(
        protected OrderService $orderService
    ) {}

    /**
     * Display a paginated listing of orders with filters.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Order::query()->with(['customer', 'user', 'items']);

        // Search by order number or customer name
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('order_number', 'like', "%{$search}%")
                  ->orWhereHas('customer', function ($cq) use ($search) {
                      $cq->where('name', 'like', "%{$search}%")
                         ->orWhere('email', 'like', "%{$search}%");
                  });
            });
        }

        // Filter by Status
        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        // Filter by Customer
        if ($customerId = $request->input('customer_id')) {
            $query->where('customer_id', $customerId);
        }

        $perPage = min((int) $request->input('per_page', 10), 100);
        $orders = $query->latest()->paginate($perPage);

        return OrderResource::collection($orders);
    }

    /**
     * Store a newly created order.
     */
    public function store(StoreOrderRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $order = $this->orderService->createOrder(
            customerId: (int) $validated['customer_id'],
            userId: $request->user()->id,
            items: $validated['items'],
            notes: $validated['notes'] ?? null
        );

        return response()->json([
            'success' => true,
            'message' => 'Order created successfully',
            'data'    => new OrderResource($order),
        ], 201);
    }

    /**
     * Display the specified order.
     */
    public function show(Order $order): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data'    => new OrderResource($order->load(['customer', 'user', 'items.product'])),
        ]);
    }

    /**
     * Update order status (e.g. mark as processing or completed).
     */
    public function updateStatus(Request $request, Order $order): JsonResponse
    {
        $request->validate([
            'status' => ['required', 'in:pending,processing,completed'],
        ]);

        if ($order->status === 'cancelled') {
            return response()->json([
                'success' => false,
                'message' => 'Cannot update status of a cancelled order.',
            ], 422);
        }

        $order->update(['status' => $request->input('status')]);

        return response()->json([
            'success' => true,
            'message' => 'Order status updated successfully',
            'data'    => new OrderResource($order->fresh(['customer', 'user', 'items.product'])),
        ]);
    }

    /**
     * Cancel the specified order and restore stock.
     */
    public function cancel(Order $order): JsonResponse
    {
        if ($order->status === 'cancelled') {
            return response()->json([
                'success' => false,
                'message' => 'Order is already cancelled.',
            ], 422);
        }

        $cancelledOrder = $this->orderService->cancelOrder($order);

        return response()->json([
            'success' => true,
            'message' => 'Order cancelled successfully and inventory restored',
            'data'    => new OrderResource($cancelledOrder),
        ]);
    }
}
