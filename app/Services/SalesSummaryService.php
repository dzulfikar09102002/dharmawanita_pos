<?php

namespace App\Services;

use App\Models\SalesSummary;
use App\Models\SaleTransaction;

class SalesSummaryService 
{

    public function getSalesSummaryToday()
    {
        $transactions = SaleTransaction::with(['details', 'paymentMethod'])
            ->whereBetween('transaction_date', [
                now()->startOfDay(),
                now()->endOfDay()
            ])
            ->get();
        $totalTransaksi = $transactions->count();
        $totalItem = $transactions
            ->flatMap(fn ($trx) => $trx->details)
            ->sum('quantity');
        $totalPendapatan = $transactions->sum(function ($trx) {
            return max(0, ($trx->total_amount ?? 0) - ($trx->change ?? 0));
        });

        $byPaymentMethod = $transactions
        ->groupBy(fn ($trx) => $trx->payment_method_id ?? 0)
        ->map(function ($items, $paymentMethodId) {

            $method = $items->first()->paymentMethod;

            return [
                'payment_method_id' => $paymentMethodId,
                'payment_method_name' => $method->name ?? 'Lainnya',
                'payment_method_kind' => $method->kind ?? 'other', 

                'total_transaksi' => $items->count(),

                'total_nominal' => $items->sum(function ($trx) {
                    return max(0, ($trx->total_amount ?? 0) - ($trx->change ?? 0));
                }),
            ];
        })
        ->values();

        return collect([
            'total_transaksi' => $totalTransaksi,
            'total_item' => $totalItem,
            'total_pendapatan' => $totalPendapatan,
            'by_payment_method' => $byPaymentMethod,
        ]);
    }
    public function getHistorySalesSummaries()
    {
        $startDate = request('start_date')
            ? \Carbon\Carbon::parse(request('start_date'))
            : now()->subDays(7);

        $endDate = request('end_date')
            ? \Carbon\Carbon::parse(request('end_date'))
            : now();

        return SalesSummary::query()
            ->whereBetween('date', [
                $startDate->startOfDay(),
                $endDate->endOfDay()
            ])
            ->latest('date')
            ->paginate(request('per_page', 10))
            ->withQueryString();
    }
}