<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Storefront\StorefrontOrderRequest;
use App\Http\Resources\CategoryResource;
use App\Http\Resources\OrderResource;
use App\Http\Resources\ProductResource;
use App\Models\Category;
use App\Models\Customer;
use App\Models\Product;
use App\Models\User;
use App\Services\OrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class StorefrontController extends Controller
{
    public function __construct(
        protected OrderService $orderService
    ) {}

    /**
     * Get public active catalog for customers.
     */
    public function products(Request $request): AnonymousResourceCollection
    {
        $query = Product::query()->active();

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('sku', 'like', "%{$search}%");
            });
        }

        if ($category = $request->input('category')) {
            $query->where('category', $category);
        }

        $products = $query->orderBy('name')->paginate(24);

        return ProductResource::collection($products);
    }

    /**
     * Get categories for customer navigation tabs.
     */
    public function categories(): JsonResponse
    {
        $categories = Category::orderBy('name')->get();

        return response()->json([
            'success' => true,
            'data'    => CategoryResource::collection($categories),
        ]);
    }

    /**
     * Public checkout for customers.
     */
    public function checkout(StorefrontOrderRequest $request): JsonResponse
    {
        $validated = $request->validated();

        // 1. Locate or create customer record
        $customer = Customer::firstOrCreate(
            ['email' => $validated['email']],
            [
                'name'    => $validated['name'],
                'phone'   => $validated['phone'] ?? null,
                'address' => $validated['address'],
            ]
        );

        // Update phone or address if provided and was empty
        if (!empty($validated['phone']) && empty($customer->phone)) {
            $customer->update(['phone' => $validated['phone']]);
        }
        if (!empty($validated['address']) && empty($customer->address)) {
            $customer->update(['address' => $validated['address']]);
        }

        // 2. Identify assigning representative (system admin)
        $systemUser = User::where('role', 'admin')->first() ?? User::first();

        // 3. Delegate to OrderService (executes with DB::transaction and pessimistic lockForUpdate)
        $order = $this->orderService->createOrder(
            customerId: $customer->id,
            userId: $systemUser->id,
            items: $validated['items'],
            notes: $validated['notes'] ?? null
        );

        return response()->json([
            'success' => true,
            'message' => 'Your order has been placed successfully!',
            'data'    => new OrderResource($order),
        ], 201);
    }
}
