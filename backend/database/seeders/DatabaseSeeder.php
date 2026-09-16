<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Customer;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Seed Users (Admin & Staff)
        $admin = User::firstOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name'     => 'System Admin',
                'password' => Hash::make('password123'),
                'role'     => 'admin',
            ]
        );

        $staff = User::firstOrCreate(
            ['email' => 'staff@example.com'],
            [
                'name'     => 'Staff Member',
                'password' => Hash::make('password123'),
                'role'     => 'staff',
            ]
        );

        // 2. Seed Categories
        $categoriesData = [
            ['name' => 'Laptops & Computers', 'slug' => 'laptops-computers', 'description' => 'Workstations, gaming rigs, and high-performance notebooks'],
            ['name' => 'Peripherals & Accessories', 'slug' => 'peripherals-accessories', 'description' => 'Keyboards, mice, docks, and cables'],
            ['name' => 'Audio & Sound', 'slug' => 'audio-sound', 'description' => 'Studio headphones, noise-canceling headsets, and microphones'],
            ['name' => 'Monitors & Displays', 'slug' => 'monitors-displays', 'description' => '4K, UltraWide, and high-refresh-rate displays'],
            ['name' => 'Office Furniture', 'slug' => 'office-furniture', 'description' => 'Ergonomic chairs, standing desks, and monitor arms'],
        ];

        $categories = [];
        foreach ($categoriesData as $c) {
            $categories[$c['name']] = Category::firstOrCreate(['slug' => $c['slug']], $c);
        }

        // 3. Seed Products (Including Normal and Low Stock items)
        $productsData = [
            [
                'name'           => 'ProBook Studio 16"',
                'sku'            => 'LAP-PRO-16',
                'category_name'  => 'Laptops & Computers',
                'price'          => 1899.99,
                'stock_quantity' => 25,
                'status'         => 'active',
            ],
            [
                'name'           => 'UltraSlim Air 14"',
                'sku'            => 'LAP-AIR-14',
                'category_name'  => 'Laptops & Computers',
                'price'          => 1299.50,
                'stock_quantity' => 12,
                'status'         => 'active',
            ],
            [
                'name'           => 'Mechanical Wireless Keyboard',
                'sku'            => 'KB-MECH-W',
                'category_name'  => 'Peripherals & Accessories',
                'price'          => 149.00,
                'stock_quantity' => 4, // Low stock!
                'status'         => 'active',
            ],
            [
                'name'           => 'Precision Ergonomic Mouse',
                'sku'            => 'MOU-ERG-01',
                'category_name'  => 'Peripherals & Accessories',
                'price'          => 89.99,
                'stock_quantity' => 30,
                'status'         => 'active',
            ],
            [
                'name'           => 'Thunderbolt 4 Docking Station',
                'sku'            => 'DOC-TB4-PRO',
                'category_name'  => 'Peripherals & Accessories',
                'price'          => 249.00,
                'stock_quantity' => 3, // Low stock!
                'status'         => 'active',
            ],
            [
                'name'           => 'Noise-Canceling Over-Ear Headphones',
                'sku'            => 'AUD-NC-700',
                'category_name'  => 'Audio & Sound',
                'price'          => 349.99,
                'stock_quantity' => 18,
                'status'         => 'active',
            ],
            [
                'name'           => 'USB-C Studio Condenser Microphone',
                'sku'            => 'AUD-MIC-USB',
                'category_name'  => 'Audio & Sound',
                'price'          => 129.00,
                'stock_quantity' => 2, // Low stock!
                'status'         => 'active',
            ],
            [
                'name'           => '34" Curved UltraWide Gaming Monitor',
                'sku'            => 'MON-34-UW',
                'category_name'  => 'Monitors & Displays',
                'price'          => 699.00,
                'stock_quantity' => 15,
                'status'         => 'active',
            ],
            [
                'name'           => '27" 4K Color-Accurate Designer Display',
                'sku'            => 'MON-27-4K',
                'category_name'  => 'Monitors & Displays',
                'price'          => 549.50,
                'stock_quantity' => 8,
                'status'         => 'active',
            ],
            [
                'name'           => 'Ergonomic Mesh Task Chair',
                'sku'            => 'FUR-CHR-ERG',
                'category_name'  => 'Office Furniture',
                'price'          => 420.00,
                'stock_quantity' => 10,
                'status'         => 'active',
            ],
            [
                'name'           => 'Electric Dual-Motor Standing Desk',
                'sku'            => 'FUR-DSK-ELEC',
                'category_name'  => 'Office Furniture',
                'price'          => 599.00,
                'stock_quantity' => 5, // Threshold low stock
                'status'         => 'active',
            ],
            [
                'name'           => 'Braided USB-C to USB-C Cable (2m)',
                'sku'            => 'CAB-USBC-2M',
                'category_name'  => 'Peripherals & Accessories',
                'price'          => 19.99,
                'stock_quantity' => 150,
                'status'         => 'active',
            ],
            [
                'name'           => 'Legacy VGA Adapter (Archived)',
                'sku'            => 'ADP-VGA-LEG',
                'category_name'  => 'Peripherals & Accessories',
                'price'          => 14.99,
                'stock_quantity' => 0,
                'status'         => 'inactive',
            ],
        ];

        $createdProducts = [];
        foreach ($productsData as $p) {
            $cat = $categories[$p['category_name']] ?? null;
            $createdProducts[] = Product::firstOrCreate(
                ['sku' => $p['sku']],
                [
                    'name'           => $p['name'],
                    'category_id'    => $cat?->id,
                    'category'       => $p['category_name'],
                    'price'          => $p['price'],
                    'stock_quantity' => $p['stock_quantity'],
                    'status'         => $p['status'],
                ]
            );
        }

        // 4. Seed Customers
        $customersData = [
            [
                'name'    => 'Acme Corporation',
                'email'   => 'procurement@acme.example.com',
                'phone'   => '+1 (555) 234-5678',
                'address' => '100 Industrial Parkway, Suite 400, Chicago, IL',
            ],
            [
                'name'    => 'TechNova Solutions',
                'email'   => 'contact@technova.example.com',
                'phone'   => '+1 (555) 876-5432',
                'address' => '742 Evergreen Terrace, Seattle, WA',
            ],
            [
                'name'    => 'Sarah Jenkins',
                'email'   => 'sarah.jenkins@example.com',
                'phone'   => '+1 (555) 345-9876',
                'address' => '12 Elm Street, Austin, TX',
            ],
            [
                'name'    => 'Marcus Vance',
                'email'   => 'marcus.vance@example.com',
                'phone'   => '+1 (555) 654-1234',
                'address' => '456 Oak Avenue, Denver, CO',
            ],
            [
                'name'    => 'Elena Rostova',
                'email'   => 'elena.rostova@example.com',
                'phone'   => '+1 (555) 901-2345',
                'address' => '89 Pine Road, Boston, MA',
            ],
        ];

        $createdCustomers = [];
        foreach ($customersData as $cust) {
            $createdCustomers[] = Customer::firstOrCreate(['email' => $cust['email']], $cust);
        }

        // 5. Seed Sample Orders with Items
        if (Order::count() === 0) {
            // Order 1: Completed order for Acme Corp
            $order1 = Order::create([
                'order_number' => 'ORD-' . date('Ymd') . '-00101',
                'customer_id'  => $createdCustomers[0]->id,
                'user_id'      => $admin->id,
                'status'       => 'completed',
                'total_amount' => 4048.98,
                'notes'        => 'Standard expedited shipping requested.',
                'created_at'   => now()->subDays(3),
            ]);

            OrderItem::create([
                'order_id'     => $order1->id,
                'product_id'   => $createdProducts[0]->id, // ProBook
                'product_name' => $createdProducts[0]->name,
                'product_sku'  => $createdProducts[0]->sku,
                'unit_price'   => 1899.99,
                'quantity'     => 2,
                'line_total'   => 3799.98,
            ]);

            OrderItem::create([
                'order_id'     => $order1->id,
                'product_id'   => $createdProducts[4]->id, // TB4 Dock
                'product_name' => $createdProducts[4]->name,
                'product_sku'  => $createdProducts[4]->sku,
                'unit_price'   => 249.00,
                'quantity'     => 1,
                'line_total'   => 249.00,
            ]);

            // Order 2: Processing order for TechNova Solutions
            $order2 = Order::create([
                'order_number' => 'ORD-' . date('Ymd') . '-00102',
                'customer_id'  => $createdCustomers[1]->id,
                'user_id'      => $staff->id,
                'status'       => 'processing',
                'total_amount' => 848.00,
                'notes'        => 'Deliver to 2nd floor reception.',
                'created_at'   => now()->subDays(1),
            ]);

            OrderItem::create([
                'order_id'     => $order2->id,
                'product_id'   => $createdProducts[9]->id, // Chair
                'product_name' => $createdProducts[9]->name,
                'product_sku'  => $createdProducts[9]->sku,
                'unit_price'   => 420.00,
                'quantity'     => 2,
                'line_total'   => 840.00,
            ]);

            OrderItem::create([
                'order_id'     => $order2->id,
                'product_id'   => $createdProducts[11]->id, // Cable
                'product_name' => $createdProducts[11]->name,
                'product_sku'  => $createdProducts[11]->sku,
                'unit_price'   => 19.99,
                'quantity'     => 2,
                'line_total'   => 39.98,
            ]);
            $order2->update(['total_amount' => 879.98]);
        }
    }
}
