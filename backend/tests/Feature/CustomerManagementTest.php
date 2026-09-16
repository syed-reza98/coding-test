<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CustomerManagementTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->create(['role' => 'admin']);
    }

    public function test_can_create_and_update_customer_with_validation(): void
    {
        $payload = [
            'name'    => 'Johnathan Doe',
            'email'   => 'john@example.com',
            'phone'   => '123-456-7890',
            'address' => '123 Main St, Springfield',
        ];

        // Create
        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/v1/customers', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.name', 'Johnathan Doe');

        $customerId = $response->json('data.id');

        // Update
        $updateResponse = $this->actingAs($this->admin, 'sanctum')
            ->putJson("/api/v1/customers/{$customerId}", [
                'name'  => 'Johnathan Doe Updated',
                'email' => 'john@example.com', // same email should pass unique check
            ]);

        $updateResponse->assertStatus(200)
            ->assertJsonPath('data.name', 'Johnathan Doe Updated');

        // Duplicate email for different customer should fail
        $duplicateEmailResponse = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/v1/customers', [
                'name'  => 'Jane Doe',
                'email' => 'john@example.com',
            ]);

        $duplicateEmailResponse->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }
}
