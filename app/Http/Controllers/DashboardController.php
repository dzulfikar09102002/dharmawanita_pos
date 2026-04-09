<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Product;
use App\Services\DashboardService;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function __construct(
        private DashboardService $service
    ) {}


     public function index()
{
    $products = $this->service->getExpiredProducts();

    return Inertia::render('dashboard', [
        'expiredProducts' => $this->service->getExpiredProducts(),
        'bestSellingProducts' => $this->service->getBestSellingProducts(),
    ]);
}
}
