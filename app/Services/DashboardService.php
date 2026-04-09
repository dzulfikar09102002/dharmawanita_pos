<?php

namespace App\Services;

use App\Models\Product;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use App\Models\SaleTransactionDetail;
use App\Models\SaleTransaction;
use App\Models\Purchase;

class DashboardService
{
    public function getExpiredProducts()
    {
        return Product::query()
            ->whereNotNull('expired_date')
            ->orderBy('expired_date', 'asc')
            ->limit(5)
            ->get();
    }

    public function getBestSellingProducts($month, $year)
    {
        return SaleTransactionDetail::query()
            ->select('product_id', DB::raw('SUM(quantity) as total_sold'))
            ->with('product')
            ->whereHas('saleTransaction', function ($q) use ($month, $year) {
                $q->whereMonth('transaction_date', $month)
                ->whereYear('transaction_date', $year);
            })
            ->groupBy('product_id')
            ->orderByDesc('total_sold')
            ->limit(5)
            ->get();
    }

    public function getMonthlyIncome($month, $year)
    {
        return SaleTransaction::query()
            ->whereMonth('transaction_date', $month)
            ->whereYear('transaction_date', $year) 
            ->sum('grand_total');
    }

    public function getMonthlyExpense($month, $year)
    {
        return Purchase::query()
            ->whereMonth('purchase_date', $month)
            ->whereYear('purchase_date', $year) 
            ->sum('purchase_price');
    }

    public function getProfit($month, $year)
    {
        $income = $this->getMonthlyIncome($month, $year); 
        $expense = $this->getMonthlyExpense($month, $year);

        return $income - $expense;
    }

    public function getReceivable($month, $year)
    {
        return SaleTransaction::query()
            ->where('payment_status', 'pending')
            ->whereMonth('transaction_date', $month)
            ->whereYear('transaction_date', $year) 
            ->sum('grand_total');
    }

    public function getDailySalesChart($month, $year)
    {
        return SaleTransaction::query()
            ->select(
                DB::raw('DATE(transaction_date) as date'),
                DB::raw('SUM(grand_total) as total')
            )
            ->whereMonth('transaction_date', $month)
            ->whereYear('transaction_date', $year) 
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