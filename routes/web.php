<?php

use App\Http\Controllers\PaymentMethodController;
use App\Http\Controllers\PurchaseController;
use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\SupplierController;
use App\Http\Controllers\SalesReportController;

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

    Route::resource('/categories', CategoryController::class)->except(['show']);
    Route::get('/categories/deleted', [CategoryController::class, 'deleted'])
        ->name('categories.deleted');
    Route::post('/categories/{id}/restore', [CategoryController::class, 'restore'])
        ->name('categories.restore');

    Route::resource('/suppliers', SupplierController::class)->except('show');
    Route::get('suppliers/deleted', [SupplierController::class, 'deleted'])
    ->name('suppliers.deleted');
    Route::post('suppliers/{id}/restore', [SupplierController::class, 'restore'])
    ->name('suppliers.restore');  

    Route::resource('/purchases', PurchaseController::class)->except('show');
    Route::get('purchase/deleted', [PurchaseController::class, 'deleted'])
    ->name('purchase.deleted');
    Route::post('purchase/{id}/restore', [PurchaseController::class, 'restore'])
    ->name('purchase.restore');  

    Route::resource('/reports/sales', SalesReportController::class)
    ->names('reports.sales');
    Route::post('/reports/sales/{id}/cancel', [SalesReportController::class, 'cancel'])
        ->name('reports.sales.cancel');
});

require __DIR__.'/settings.php';
