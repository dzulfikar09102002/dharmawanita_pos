<?php

namespace App\Services;

use App\Models\SalesSummary;
use App\Models\SalesSummaryDetail;
use App\Models\SaleTransaction;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class SalesSummaryService 
{

    public function getSalesSummaryToday()
    {
        // 🔹 ambil rekap terakhir hari ini
        $lastSummary = SalesSummary::whereDate('date', today())
            ->latest('date')
            ->first();
        // 🔹 tentukan start waktu
        $start = $lastSummary
            ? $lastSummary->date // setelah rekap terakhir
            : now()->startOfDay(); // kalau belum ada rekap

        $end = now();
        // 🔹 ambil transaksi
        $transactions = SaleTransaction::with(['details', 'paymentMethod'])
            ->whereBetween('transaction_date', [$start, $end])
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
            'start_from' => $start, // 🔥 tambahan info
            'total_transaksi' => $totalTransaksi,
            'total_item' => $totalItem,
            'total_pendapatan' => $totalPendapatan,
            'by_payment_method' => $byPaymentMethod,
        ]);
    }
    public function getHistorySalesSummaries()
    {
        $startDate = request('start_date')
            ? Carbon::createFromFormat('Y-m-d', request('start_date'))
            : now()->subDays(7);

        $endDate = request('end_date')
            ? Carbon::createFromFormat('Y-m-d', request('end_date'))
            : now();

        return SalesSummary::query()
            ->whereBetween('date', [
                $startDate->copy()->startOfDay(),
                $endDate->copy()->endOfDay(),
            ])
            ->latest('date')
            ->paginate(request('per_page', 10))
            ->withQueryString();
    }
    
    public function store(array $data): SalesSummary
    {
        return DB::transaction(function () use ($data) {

            $userId = auth()->id();

            // 🔹 simpan header
            $summary = SalesSummary::create([
                'date' => now(),
                'total_sales' => $data['total_sales'],
                'total_transactions' => $data['total_transactions'],
                'created_by' => $userId,
            ]);

            // 🔹 prepare detail
            $details = collect($data['details'])->map(function ($item) use ($summary, $userId) {
                return [
                    'sales_summary_id' => $summary->id,
                    'payment_method_id' => $item['payment_method_id'],
                    'total_amount' => $item['total_amount'],
                    'total_transactions' => $item['total_transactions'],
                    'created_by' => $userId,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            })->toArray();

            // 🔹 insert detail
            SalesSummaryDetail::insert($details);

            return $summary->load('details');
        });
    }

    public function getDetail($id)
    {
        return SalesSummary::with(['details.paymentMethod'])
            ->findOrFail($id);
    }
}