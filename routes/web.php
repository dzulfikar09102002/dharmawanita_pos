<?php

use App\Http\Controllers\PaymentMethodController;
use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\SupplierController;

Route::inertia('/', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');

Route::resource('/products', ProductController::class)->except('show');
    Route::get('products/deleted', [ProductController::class, 'deleted'])
        ->name('products.deleted');
    Route::post('products/{id}/restore', [ProductController::class, 'restore'])
        ->name('products.restore');  

    Route::resource('/payment-methods', PaymentMethodController::class)->except('show');
    Route::get('payment-methods/deleted', [PaymentMethodController::class, 'deleted'])
        ->name('payment-methods.deleted');
    Route::post('payment-methods/{id}/restore', [PaymentMethodController::class, 'restore'])
        ->name('payment-methods.restore'); 

      // Resource CRUD standar
    Route::resource('/categories', CategoryController::class)->except(['show']);
    Route::get('/categories/deleted', [CategoryController::class, 'deleted'])
        ->name('categories.deleted');
    Route::post('/categories/{id}/restore', [CategoryController::class, 'restore'])
        ->name('categories.restore');

    Route::resource('/suppliers', SupplierController::class);
});

require __DIR__.'/settings.php';
