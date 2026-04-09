<?php

namespace App\Services;

use App\Models\Product;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use App\Models\SaleTransactionDetail;

class DashboardService
{
    public function getExpiredProducts($month)
    {
        return Product::query()
            ->whereNotNull('expired_date') 
            ->whereDate('expired_date', '>=', Carbon::today()) 
            ->orderBy('expired_date', 'asc') 
            ->limit(5) 
            ->get();
    }

    public function getBestSellingProducts($month)
    {
        return SaleTransactionDetail::query()
            ->select('product_id', DB::raw('SUM(quantity) as total_sold'))
            ->with('product')
            ->whereHas('saleTransaction', function ($q) use ($month) {
                $q->whereMonth('transaction_date', $month);
            })
            ->groupBy('product_id')
            ->orderByDesc('total_sold')
            ->limit(5)
            ->get();
    }

   public function getMonthlyIncome($month)
    {
        return \App\Models\SaleTransaction::query()
            ->whereMonth('transaction_date', $month)
            ->sum('grand_total');
    }

    public function getMonthlyExpense($month)
    {
        return \App\Models\Purchase::query()
            ->whereMonth('purchase_date', $month)
            ->sum('purchase_price');
    }

    public function getProfit($month)
    {
        $income = $this->getMonthlyIncome($month);
        $expense = $this->getMonthlyExpense($month);

        return $income - $expense;
    }

    public function getReceivable($month)
    {
        return \App\Models\SaleTransaction::query()
            ->where('payment_status', 'pending')
            ->whereMonth('transaction_date', $month)
            ->sum('grand_total');
    }

    public function getDailySalesChart($month)
    {
        return \App\Models\SaleTransaction::query()
            ->select(
                DB::raw('DATE(transaction_date) as date'),
                DB::raw('SUM(grand_total) as total')
            )
            ->whereMonth('transaction_date', $month)
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->map(function ($item) {
                return [
                    'date' => $item->date,
                    'total' => (int) $item->total,
                ];
            });
    }
}