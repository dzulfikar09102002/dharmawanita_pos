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
        $month = request('month', now()->month);

        return Inertia::render('dashboard', [
            'expiredProducts' => $this->service->getExpiredProducts($month),
            'bestSellingProducts' => $this->service->getBestSellingProducts($month),

            'income' => $this->service->getMonthlyIncome($month),
            'expense' => $this->service->getMonthlyExpense($month),
            'profit' => $this->service->getProfit($month),
            'receivable' => $this->service->getReceivable($month),

            'dailySales' => $this->service->getDailySalesChart($month),

            'month' => (int) $month, 
        ]);
    }
}
