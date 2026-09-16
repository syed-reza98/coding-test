<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderProcessingTest extends TestCase
{
    use RefreshDatabase;

    protected User $staff;
    protected Customer $customer;
    protected Product $product;

    protected function setUp(): void
    {
        parent::setUp();

        $this->staff = User::factory()->create([
            'role' => 'staff',
        ]);

        $this->customer = Customer::create([
            'name'  => 'Test Customer',
            'email' => 'customer@test.com',
            'phone' => '1234567890',
        ]);

        $this->product = Product::create([
            'name'           => 'Test Gadget',
            'sku'            => 'TEST-GADGET-01',
            'category'       => 'Electronics',
            'price'          => 100.00,
            'stock_quantity' => 10,
            'status'         => 'active',
        ]);
    }

    public function test_can_create_order_and_stock_is_deducted(): void
    {
        $payload = [
            'customer_id' => $this->customer->id,
            'items'       => [
                [
                    'product_id' => $this->product->id,
                    'quantity'   => 4,
                ],
            ],
            // Sending fake total to test server-side calculation enforcement
            'total_amount' => 10.00,
        ];

        $response = $this->actingAs($this->staff, 'sanctum')
            ->postJson('/api/v1/orders', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('success', true);

        $this->assertEquals(400.00, $response->json('data.total_amount'));

        $this->assertDatabaseHas('products', [
            'id'             => $this->product->id,
            'stock_quantity' => 6, // 10 - 4
        ]);
    }

    public function test_cannot_order_more_than_available_stock(): void
    {
        $payload = [
            'customer_id' => $this->customer->id,
            'items'       => [
                [
                    'product_id' => $this->product->id,
                    'quantity'   => 15, // Only 10 available
                ],
            ],
        ];

        $response = $this->actingAs($this->staff, 'sanctum')
            ->postJson('/api/v1/orders', $payload);

        $response->assertStatus(409)
            ->assertJsonPath('error', 'OUT_OF_STOCK');

        // Stock remains untouched
        $this->assertDatabaseHas('products', [
            'id'             => $this->product->id,
            'stock_quantity' => 10,
        ]);
    }

    public function test_cancelling_order_restores_stock(): void
    {
        // Place an order for 3 items
        $order = app(\App\Services\OrderService::class)->createOrder(
            customerId: $this->customer->id,
            userId: $this->staff->id,
            items: [
                ['product_id' => $this->product->id, 'quantity' => 3],
            ]
        );

        $this->assertEquals(7, $this->product->fresh()->stock_quantity);

        // Cancel order via API
        $response = $this->actingAs($this->staff, 'sanctum')
            ->postJson("/api/v1/orders/{$order->id}/cancel");

        $response->assertStatus(200)
            ->assertJsonPath('data.status', 'cancelled');

        $this->assertEquals(10, $this->product->fresh()->stock_quantity);
    }
}
