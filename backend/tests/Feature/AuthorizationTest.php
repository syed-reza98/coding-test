<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthorizationTest extends TestCase
{
    use RefreshDatabase;
    protected User $admin;
    protected User $staff;
    protected Product $product;
    protected Customer $customer;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create(['role' => 'admin']);
        $this->staff = User::factory()->create(['role' => 'staff']);

        $this->product = Product::create([
            'name'           => 'Auth Test Product',
            'sku'            => 'AUTH-TEST-01',
            'category'       => 'Test Category',
            'price'          => 50.00,
            'stock_quantity' => 10,
            'status'         => 'active',
        ]);

        $this->customer = Customer::create([
            'name'  => 'Auth Test Customer',
            'email' => 'auth_customer@test.com',
            'phone' => '999999999',
        ]);
    }

    public function test_staff_cannot_delete_product(): void
    {
        $response = $this->actingAs($this->staff, 'sanctum')
            ->deleteJson("/api/v1/products/{$this->product->id}");

        $response->assertStatus(403);
        $this->assertNotSoftDeleted($this->product);
    }

    public function test_staff_cannot_delete_customer(): void
    {
        $response = $this->actingAs($this->staff, 'sanctum')
            ->deleteJson("/api/v1/customers/{$this->customer->id}");

        $response->assertStatus(403);
        $this->assertNotSoftDeleted($this->customer);
    }

    public function test_admin_can_delete_product(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->deleteJson("/api/v1/products/{$this->product->id}");

        $response->assertStatus(200);
        $this->assertSoftDeleted($this->product);
    }

    public function test_admin_can_delete_customer(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->deleteJson("/api/v1/customers/{$this->customer->id}");

        $response->assertStatus(200);
        $this->assertSoftDeleted($this->customer);
    }
}
