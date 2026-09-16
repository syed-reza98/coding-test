<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\ProductController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| REST API Routes (v1)
|--------------------------------------------------------------------------
*/

Route::prefix('v1')->group(function () {

    // Public authentication routes
    Route::post('auth/login', [AuthController::class, 'login']);

    // Public Customer Storefront (Catalog & Checkout)
    Route::get('storefront/products', [\App\Http\Controllers\Api\StorefrontController::class, 'products']);
    Route::get('storefront/categories', [\App\Http\Controllers\Api\StorefrontController::class, 'categories']);
    Route::post('storefront/orders', [\App\Http\Controllers\Api\StorefrontController::class, 'checkout']);

    // Protected API routes
    Route::middleware('auth:sanctum')->group(function () {

        // Current user & logout
        Route::post('auth/logout', [AuthController::class, 'logout']);
        Route::get('auth/me', [AuthController::class, 'me']);

        // Dashboard statistics
        Route::get('dashboard', [DashboardController::class, 'index']);

        // Categories listing
        Route::get('categories', [CategoryController::class, 'index']);

        // Products CRUD (Admin + Staff can list, view, create, update)
        Route::apiResource('products', ProductController::class)->except(['destroy']);

        // Customers CRUD (Admin + Staff can list, view, create, update)
        Route::apiResource('customers', CustomerController::class)->except(['destroy']);

        // Orders Management (Admin + Staff can list, view, create, cancel)
        Route::apiResource('orders', OrderController::class)->except(['destroy', 'update']);
        Route::patch('orders/{order}/status', [OrderController::class, 'updateStatus']);
        Route::post('orders/{order}/cancel', [OrderController::class, 'cancel']);

        // Strictly Admin-only actions (Part A requirement: "Only Admin can delete products and customers")
        Route::middleware('role:admin')->group(function () {
            Route::delete('products/{product}', [ProductController::class, 'destroy']);
            Route::delete('customers/{customer}', [CustomerController::class, 'destroy']);
        });

    });

});
