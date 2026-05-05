<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Services\LabaRugiService;
use Barryvdh\DomPDF\Facade\Pdf;
use App\Models\SaleTransaction;
use App\Models\Purchase;
use App\Models\Product;
use App\Models\Category;

class LabaRugiController extends Controller
{
     public function __construct(
        private LabaRugiService $service
    ) {}

    public function index(?int $bulan = null, ?int $tahun = null)
    {
        $bulan = $bulan ?? now()->month;
        $tahun = $tahun ?? now()->year;

        $data = $this->service->getLabaRugi($bulan, $tahun);
        return Inertia::render('laba-rugi/index', compact('data'));
    }

    public function printLabaRugi(Request $request)
    {
        $request->validate([
            'type' => 'required|in:month,year',
            'tahun' => 'required|integer',
            'bulan' => 'nullable|integer|min:1|max:12',
        ]);

        $type  = $request->type;
        $bulan = $request->bulan;
        $tahun = $request->tahun;

        $queryPendapatan = SaleTransaction::query()
            ->where('payment_type', 'cash')
            ->where('payment_status', '!=', 'canceled');

        $queryPiutang = SaleTransaction::query()
            ->where('payment_type', 'credit')
            ->where('payment_status', '!=', 'canceled');

        $queryPembelian = Purchase::query()
            ->where('payment_type', 'cash')
            ->where('status_payment', '!=', 'canceled');

        $queryUtang = Purchase::query()
            ->where('payment_type', 'credit')
            ->where('status_payment', '!=', 'canceled');

        if ($type === 'month') {
            if (!$bulan) {
                abort(400, 'Bulan wajib diisi');
            }

            $queryPendapatan->whereMonth('transaction_date', $bulan)
                            ->whereYear('transaction_date', $tahun);

            $queryPiutang->whereMonth('transaction_date', $bulan)
                        ->whereYear('transaction_date', $tahun);

            $queryPembelian->whereMonth('purchase_date', $bulan)
                            ->whereYear('purchase_date', $tahun);

            $queryUtang->whereMonth('purchase_date', $bulan)
                        ->whereYear('purchase_date', $tahun);

        } else {
            $queryPendapatan->whereYear('transaction_date', $tahun);
            $queryPiutang->whereYear('transaction_date', $tahun);
            $queryPembelian->whereYear('purchase_date', $tahun);
            $queryUtang->whereYear('purchase_date', $tahun);
        }

        $totalPendapatan = (float) $queryPendapatan
            ->where('payment_status', 'paid')
            ->sum('grand_total');

        $totalPendapatanPiutang = (float) $queryPiutang
            ->sum('total_amount'); 

        $totalPembelian = (float) $queryPembelian
            ->sum('total_payment');

        $totalUtang = (float) $queryUtang
            ->sum('total_payment');
            
        $laba = $totalPendapatan 
            + $totalPendapatanPiutang 
            - $totalPembelian 
            - $totalUtang;

        $data = [
            'type' => $type,
            'bulan' => $bulan,
            'tahun' => $tahun,
            'total_pendapatan' => $totalPendapatan,
            'total_pendapatan_piutang' => $totalPendapatanPiutang,
            'total_pembelian' => $totalPembelian,
            'total_utang' => $totalUtang,
            'laba_rugi' => $laba,
        ];

        $pdf = Pdf::loadView('reports.laba-rugi-pdf', [
            'data' => $data,
            'type' => $type,
            'bulan' => $bulan,
            'tahun' => $tahun,
        ])->setPaper('a4', 'portrait');

        return $pdf->stream('laporan-laba-rugi.pdf');
    }

}
