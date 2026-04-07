<?php

use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\SupplierController;

Route::inertia('/', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');
});

Route::get('/products', [ProductController::class, 'index']);
Route::get('/suppliers', [SupplierController::class, 'index']);
// Route::post('/products', [ProductController::class, 'store']);
Route::post('/products', [ProductController::class, 'store'])
    ->withoutMiddleware(\App\Http\Middleware\VerifyCsrfToken::class);
require __DIR__.'/settings.php';
