<?php

use App\Http\Controllers\PaymentMethodController;
use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\CategoryController;

Route::inertia('/', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');

    Route::resource('/products', ProductController::class);
    Route::resource('/payment-methods', PaymentMethodController::class);
    Route::resource('/categories', CategoryController::class);
});


require __DIR__.'/settings.php';
