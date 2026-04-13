<?php 

namespace App\Services;

use App\Models\SaleTransaction;
use App\Models\Purchase;
use App\Models\Product;
use App\Models\Category;

class LabaRugiService
{
    public function getLabaRugi(?int $bulan, int $tahun)
{
    // Base query
    $queryPendapatan = SaleTransaction::query()
        ->whereYear('transaction_date', $tahun);

    $queryPiutang = SaleTransaction::query()
        ->where('created_at', '!=', 'updated_at')
        ->whereYear('transaction_date', $tahun);

    $queryPembelian = Purchase::query()
        ->whereYear('purchase_date', $tahun);

    // Jika ada bulan → filter bulan
    if ($bulan) {
        $queryPendapatan->whereMonth('transaction_date', $bulan);
        $queryPiutang->whereMonth('transaction_date', $bulan);
        $queryPembelian->whereMonth('purchase_date', $bulan);
    }

    // Eksekusi
    $totalPendapatan = $queryPendapatan
        ->where('payment_status', 'paid')
        ->sum('grand_total');

    $totalPendapatanPiutang = $queryPiutang
        ->sum('grand_total');

    $totalPembelian = $queryPembelian
        ->sum('total_payment');

    $laba = $totalPendapatan + $totalPendapatanPiutang - $totalPembelian;

    return [
        'bulan' => $bulan,
        'tahun' => $tahun,
        'total_pendapatan' => $totalPendapatan,
        'total_pendapatan_piutang' => $totalPendapatanPiutang,
        'total_pembelian' => $totalPembelian,
        'laba_rugi' => $laba,
    ];
}
    
}