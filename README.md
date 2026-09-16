# OrderFlow — Full-Stack Order Management System

A production-grade, full-stack **Order Management System (OMS)** developed in accordance with the practical coding test specification. 

* **Backend**: Laravel 11 (PHP 8.4) REST API, Sanctum Token Authentication, Form Requests, API Resources, Service-Domain Layer (`OrderService`), and Pessimistic Concurrency Locking.
* **Frontend**: Next.js 16 (React 19) App Router, TypeScript, Tailwind CSS, and Lucide Icons.
* **Database**: MySQL 11 (MariaDB) / InnoDB with foreign key cascades/restrictions, check constraints, and soft deletes.

---

## 1. Quick Start & Setup Instructions

### Prerequisites
* PHP 8.1+ (PHP 8.4 tested) with extensions: `mbstring`, `xml`, `curl`, `zip`, `bcmath`, `pdo_mysql`.
* Composer 2.x
* Node.js 18+ (Node.js 24 tested) & npm
* Running MySQL / MariaDB server (e.g. XAMPP MySQL running on port 3306)

---

### Step 1: Database Setup
Make sure MySQL is running on `127.0.0.1:3306`. Create the database:
```bash
mysql -h 127.0.0.1 -u root -e "CREATE DATABASE IF NOT EXISTS order_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

---

### Step 2: Backend Setup (Laravel 11)
```bash
cd backend

# 1. Install dependencies (if not already installed)
composer install

# 2. Environment configuration (already configured for localhost MySQL)
cp .env.example .env # verify DB_DATABASE=order_management, DB_USERNAME=root, DB_PASSWORD=

# 3. Generate application key
php artisan key:generate

# 4. Run database migrations & seeders
php artisan migrate:fresh --seed

# 5. Start the backend API server (runs on http://localhost:8000)
php artisan serve
```

---

### Step 3: Frontend Setup (Next.js 16)
In a separate terminal window:
```bash
cd frontend

# 1. Install dependencies
npm install

# 2. Run the Next.js development server (runs on http://localhost:3000)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 2. Default Test Credentials

The database seeder provisions two default accounts for testing Role-Based Access Control (RBAC):

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@example.com` | `password123` | Full access: CRUD products, customers, and orders; can delete products and customers. |
| **Staff** | `staff@example.com` | `password123` | Operational access: List, view, create, edit products/customers; create and manage orders. **Delete restricted**. |

> **Note**: The login screen includes convenient 1-click **"Admin Account"** and **"Staff Account"** buttons that auto-fill these credentials.

---

## 3. Running Automated Tests

Run the backend feature test suite covering authentication, role permissions, and transactional order stock logic:
```bash
cd backend
php artisan test
```
* **Results**: 15/15 tests pass with 53 assertions, testing:
  * Public storefront catalog browsing, customer checkout, and concurrency stockouts.
  * Internal order creation with automatic stock deduction.
  * Server-side verified calculation (rejecting faked client totals).
  * Out-of-stock prevention (HTTP 409 Conflict).
  * Order cancellation and automatic inventory restoration.
  * Staff deletion restriction (HTTP 403 Forbidden).
  * Admin deletion allowance (HTTP 200 OK + Soft Delete).
  * Product and customer CRUD with unique validation.

---

## 4. REST API Endpoint Documentation (`/api/v1`)

### Public Storefront (Customer Catalog & Checkout)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/storefront/products` | Public catalog with live stock status and category filters | Public |
| `GET` | `/api/v1/storefront/categories` | Public categories for navigation tabs | Public |
| `POST` | `/api/v1/storefront/orders` | Customer checkout with **pessimistic lock**, auto customer record, and stock deduction | Public |

### Authentication
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/login` | Authenticate and obtain Sanctum bearer token | Public |
| `POST` | `/api/v1/auth/logout` | Revoke current access token | Authenticated |
| `GET` | `/api/v1/auth/me` | Fetch authenticated user profile and role | Authenticated |

### Dashboard
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/dashboard` | Aggregated metrics, low-stock alerts, recent orders, sales chart | Authenticated |

### Categories
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/categories` | Retrieve all categories for product filtering | Authenticated |

### Products
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/products` | Paginated product list (`?search=`, `?category=`, `?status=`, `?low_stock=true`) | Authenticated |
| `POST` | `/api/v1/products` | Create a new product (validates unique SKU, non-negative price/stock) | Admin / Staff |
| `GET` | `/api/v1/products/{id}` | View single product details | Authenticated |
| `PUT` | `/api/v1/products/{id}` | Update product details | Admin / Staff |
| `DELETE`| `/api/v1/products/{id}` | Soft-delete product record | **Admin Only (403 for Staff)** |

### Customers
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/customers` | Paginated customer list (`?search=`) | Authenticated |
| `POST` | `/api/v1/customers` | Register a new customer profile | Admin / Staff |
| `GET` | `/api/v1/customers/{id}`| View customer details and historical order count | Authenticated |
| `PUT` | `/api/v1/customers/{id}`| Update customer profile | Admin / Staff |
| `DELETE`| `/api/v1/customers/{id}`| Soft-delete customer record | **Admin Only (403 for Staff)** |

### Orders & Business Logic
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/orders` | Paginated orders (`?search=`, `?status=`, `?customer_id=`) | Authenticated |
| `POST` | `/api/v1/orders` | Create order with **pessimistic lock**, atomic deduction, server-side totals | Admin / Staff |
| `GET` | `/api/v1/orders/{id}` | View detailed order with line item snapshots and invoice data | Authenticated |
| `PATCH`| `/api/v1/orders/{id}/status` | Update order status (`pending`, `processing`, `completed`) | Admin / Staff |
| `POST` | `/api/v1/orders/{id}/cancel` | Cancel order and **atomically restore inventory stock** | Admin / Staff |

---

## 5. Technical Question & Concurrency Architecture

### Scenario
> **Scenario**: Two customers place orders for the last 5 units of the same product at almost exactly the same time.  
> **Question**: What could go wrong with a simple stock check? Explain how you would prevent overselling using Laravel/MySQL concurrency controls and database transactions. Also explain how the React/Next.js frontend should handle an API response indicating that stock is no longer available.

### Answer & Implementation Details:

1. **What could go wrong? (The Race Condition / TOCTOU)**:
   In a naive check-then-act implementation (`if ($product->stock >= $qty) { $product->decrement(...); }`), both incoming HTTP requests read the stock count as `5` simultaneously before either has written changes. Both checks pass, both subtract 5, and the database stock either drops to `-5` or throws an unhandled constraint exception after orders have already been confirmed. Warehouse operations are promised 10 units when only 5 exist.

2. **Backend Concurrency Control (`OrderService.php`)**:
   * **Database Transaction**: Order creation and stock adjustments are strictly enclosed within `DB::transaction(function() { ... })`.
   * **Pessimistic Locking (`lockForUpdate()`)**: When querying candidate products, `Product::where('id', $id)->lockForUpdate()->first()` instructs MySQL InnoDB to acquire an exclusive row-level lock (`SELECT ... FOR UPDATE`).
   * **Serialization**: The second transaction is placed into a wait queue by MySQL until the first transaction finishes and commits. Once released, the second transaction reads the committed stock (`0`), fails the stock threshold check, and aborts with an `InsufficientStockException` (HTTP 409 Conflict).
   * **Safety Net Constraint**: Database table definitions enforce `stock_quantity INT UNSIGNED` and check constraints (`CHECK (stock_quantity >= 0)`).

3. **Frontend Handling in Next.js (`frontend/src/app/(dashboard)/orders/new/page.tsx`)**:
   * **Non-destructive UI**: When an HTTP 409 `OUT_OF_STOCK` response arrives, the user's form state (selected customer, notes, and other line items) is **never wiped**.
   * **Inline Conflict Indicators**: The specific items that failed are flagged with an out-of-stock badge showing the actual remaining inventory count returned by the API (`available_stock`).
   * **Actionable Next Steps**: The user can adjust the quantity down to what remains or remove the sold-out item and complete checkout without refreshing the page.

---

## 6. Bonus Features Implemented Checklist

- [x] **Dedicated `OrderService`**: Clean service layer separating business transactions from controllers.
- [x] **Concurrency & Race Condition Prevention**: InnoDB row-level locking via `lockForUpdate()`.
- [x] **Automatic Stock Restoration**: `POST /orders/{id}/cancel` safely replenishes stock in a transaction.
- [x] **Comprehensive Automated Feature Tests**: 9 PHPUnit tests verifying authorization, order creation, and stock logic.
- [x] **Debounced Search**: 350ms debounced searching across products, customers, and orders.
- [x] **Role-Based Navigation & UI**: Admin vs Staff role badges; deletion buttons protected on both backend policies and frontend UI.
- [x] **Order Invoice & Printable View**: Dedicated printable invoice page with `window.print()` layout at `/orders/[id]`.
- [x] **Soft Deletes**: Configured on Products, Customers, and Orders to prevent accidental permanent data loss.
- [x] **Docker Compose Configuration**: Ready-to-use `docker-compose.yml` orchestrating MySQL, Laravel, and Next.js.
