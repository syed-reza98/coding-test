<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductManagementTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->create(['role' => 'admin']);
    }

    public function test_can_list_products_with_pagination_and_search(): void
    {
        Product::create([
            'name'           => 'Alpha Monitor',
            'sku'            => 'MON-ALPHA-01',
            'category'       => 'Monitors',
            'price'          => 300.00,
            'stock_quantity' => 10,
            'status'         => 'active',
        ]);

        Product::create([
            'name'           => 'Beta Keyboard',
            'sku'            => 'KB-BETA-01',
            'category'       => 'Accessories',
            'price'          => 80.00,
            'stock_quantity' => 20,
            'status'         => 'active',
        ]);

        // Search for Alpha
        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/v1/products?search=Alpha');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Alpha Monitor');

        // Filter by category
        $filterResponse = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/v1/products?category=Accessories');

        $filterResponse->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.sku', 'KB-BETA-01');
    }

    public function test_cannot_create_product_with_duplicate_sku_or_negative_price(): void
    {
        Product::create([
            'name'           => 'Existing Item',
            'sku'            => 'SKU-UNIQUE-01',
            'category'       => 'General',
            'price'          => 50.00,
            'stock_quantity' => 5,
            'status'         => 'active',
        ]);

        // Duplicate SKU
        $duplicateResponse = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/v1/products', [
                'name'           => 'Another Item',
                'sku'            => 'SKU-UNIQUE-01',
                'category'       => 'General',
                'price'          => 20.00,
                'stock_quantity' => 5,
                'status'         => 'active',
            ]);

        $duplicateResponse->assertStatus(422)
            ->assertJsonValidationErrors(['sku']);

        // Negative price
        $negativeResponse = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/v1/products', [
                'name'           => 'Invalid Item',
                'sku'            => 'SKU-NEW-02',
                'category'       => 'General',
                'price'          => -10.00,
                'stock_quantity' => -5,
                'status'         => 'active',
            ]);

        $negativeResponse->assertStatus(422)
            ->assertJsonValidationErrors(['price', 'stock_quantity']);
    }
}
