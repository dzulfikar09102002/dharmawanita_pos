<?php 

namespace App\Services;

use App\Models\SaleTransaction;
use App\Models\Purchase;
use App\Models\Product;
use App\Models\Category;

class LabaRugiService
{
    public function getLabaRugi(int $bulan, int $tahun)
    {
        $totalPendapatan = SaleTransaction::where('payment_status', 'paid')
        ->whereMonth('transaction_date', $bulan)
        ->whereYear('transaction_date', $tahun)
        ->sum('grand_total');

        $totalPendapatanPiutang = SaleTransaction::where('created_at', '!=', 'updated_at')
        ->whereMonth('transaction_date', $bulan)
        ->whereYear('transaction_date', $tahun)
        ->sum('grand_total');

        $totalPembelian = Purchase::whereMonth('purchase_date', $bulan)
            ->whereYear('purchase_date', $tahun)
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