<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StorefrontTest extends TestCase
{
    use RefreshDatabase;

    protected Product $product;

    protected function setUp(): void
    {
        parent::setUp();

        User::factory()->create(['role' => 'admin']);

        $category = Category::create([
            'name' => 'Tech Gadgets',
            'slug' => 'tech-gadgets',
        ]);

        $this->product = Product::create([
            'name'           => 'Wireless Noise Cancelling Earbuds',
            'sku'            => 'EAR-NC-001',
            'category_id'    => $category->id,
            'category'       => $category->name,
            'price'          => 129.99,
            'stock_quantity' => 5,
            'status'         => 'active',
        ]);
    }

    public function test_public_customer_can_browse_catalog(): void
    {
        $response = $this->getJson('/api/v1/storefront/products');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Wireless Noise Cancelling Earbuds');
    }

    public function test_customer_can_place_order_through_storefront(): void
    {
        $payload = [
            'name'    => 'Customer Alice',
            'email'   => 'alice@example.com',
            'phone'   => '+1 (555) 123-4567',
            'address' => '742 Evergreen Terrace, Springfield',
            'items'   => [
                [
                    'product_id' => $this->product->id,
                    'quantity'   => 2,
                ],
            ],
            'notes'   => 'Please leave at the front door.',
        ];

        $response = $this->postJson('/api/v1/storefront/orders', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.total_amount', 259.98); // 2 * 129.99

        $this->assertDatabaseHas('products', [
            'id'             => $this->product->id,
            'stock_quantity' => 3, // 5 - 2
        ]);

        $this->assertDatabaseHas('customers', [
            'email' => 'alice@example.com',
            'name'  => 'Customer Alice',
        ]);
    }

    public function test_storefront_prevents_overselling_beyond_stock(): void
    {
        $payload = [
            'name'    => 'Customer Bob',
            'email'   => 'bob@example.com',
            'address' => '100 Main St',
            'items'   => [
                [
                    'product_id' => $this->product->id,
                    'quantity'   => 10, // only 5 available
                ],
            ],
        ];

        $response = $this->postJson('/api/v1/storefront/orders', $payload);

        $response->assertStatus(409)
            ->assertJsonPath('error', 'OUT_OF_STOCK');

        $this->assertDatabaseHas('products', [
            'id'             => $this->product->id,
            'stock_quantity' => 5,
        ]);
    }
}
