<?php

namespace App\Services;

use App\Models\Product;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use App\Models\SaleTransactionDetail;

class DashboardService
{
    public function getExpiredProducts()
    {
        return Product::query()
            ->whereNotNull('expired_date') 
            ->whereDate('expired_date', '>=', Carbon::today()) 
            ->orderBy('expired_date', 'asc') 
            ->limit(5) 
            ->get();
    }

    public function getBestSellingProducts()
    {
        return SaleTransactionDetail::query()
            ->select('product_id', DB::raw('SUM(quantity) as total_sold'))
            ->with('product')
            ->groupBy('product_id')
            ->orderByDesc('total_sold')
            ->limit(5)
            ->get();
    }

   public function getMonthlyIncome()
    {
        return \App\Models\SaleTransaction::query()
            ->whereMonth('transaction_date', now()->month)
            ->sum('grand_total');
    }

}