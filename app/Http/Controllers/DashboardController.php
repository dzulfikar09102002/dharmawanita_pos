<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Product;
use App\Services\DashboardService;
use Inertia\Inertia;
use App\Models\Purchase;
use App\Models\SaleTransactionDetail;

class DashboardController extends Controller
{
    public function __construct(
        private DashboardService $service
    ) {}


    public function index()
    {
        $month = request('month', now()->month);
        $year = request('year', now()->year);

        return Inertia::render('dashboard', [
            'expiredProducts' => $this->service->getExpiredProducts($month, $year),
            'bestSellingProducts' => $this->service->getBestSellingProducts($month, $year),

            'income' => $this->service->getMonthlyIncome($month, $year),
            'expense' => $this->service->getMonthlyExpense($month, $year),
            'profit' => $this->service->getProfit($month, $year),
            'receivable' => $this->service->getReceivable($month, $year),
            'debt' => $this->service->getDebt($month, $year),

            'dailySales' => $this->service->getDailySalesChart($month, $year),

            'month' => (int) $month, 
            'year' => (int) $year,
        ]);
    }

public function expiredDetail()
{
    $products = Product::with('category') 
        ->whereNotNull('expired_date')
        ->orderBy('expired_date', 'asc')
        ->get();

    return inertia('dashboard/expired-detail', [
        'products' => $products,
    ]);
}

public function bestSellingDetail()
{
    $products = SaleTransactionDetail::with([
            'purchase.product.category' 
        ])
        ->selectRaw('purchase_id, SUM(quantity) as total_sold')
        ->groupBy('purchase_id')
        ->orderByDesc('total_sold')
        ->get();

    return inertia('dashboard/best-selling-detail', [
        'products' => $products,
    ]);
}


}
