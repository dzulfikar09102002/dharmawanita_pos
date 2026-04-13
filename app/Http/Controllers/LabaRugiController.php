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
        // ✅ Validasi
        $request->validate([
            'type' => 'required|in:month,year',
            'tahun' => 'required|integer',
            'bulan' => 'nullable|integer|min:1|max:12',
        ]);

        $type = $request->type;
        $bulan = $request->bulan;
        $tahun = $request->tahun;

        // ✅ Base query
        $queryPendapatan = SaleTransaction::query()
            ->where('payment_status', 'paid');

        $queryPiutang = SaleTransaction::query()
            ->where('created_at', '!=', 'updated_at');

        $queryPembelian = Purchase::query();

        // ✅ Filter berdasarkan type
        if ($type === 'month') {
            if (!$bulan) {
                abort(400, 'Bulan wajib diisi untuk laporan bulanan');
            }

            $queryPendapatan->whereMonth('transaction_date', $bulan)
                            ->whereYear('transaction_date', $tahun);

            $queryPiutang->whereMonth('transaction_date', $bulan)
                        ->whereYear('transaction_date', $tahun);

            $queryPembelian->whereMonth('purchase_date', $bulan)
                        ->whereYear('purchase_date', $tahun);
        }

        if ($type === 'year') {
            $queryPendapatan->whereYear('transaction_date', $tahun);
            $queryPiutang->whereYear('transaction_date', $tahun);
            $queryPembelian->whereYear('purchase_date', $tahun);
        }

        // ✅ Hitung
        $totalPendapatan = $queryPendapatan->sum('grand_total');
        $totalPendapatanPiutang = $queryPiutang->sum('grand_total');
        $totalPembelian = $queryPembelian->sum('total_payment');

        $laba = $totalPendapatan + $totalPendapatanPiutang - $totalPembelian;

        $data = [
            'type' => $type,
            'bulan' => $bulan,
            'tahun' => $tahun,
            'total_pendapatan' => $totalPendapatan,
            'total_pendapatan_piutang' => $totalPendapatanPiutang,
            'total_pembelian' => $totalPembelian,
            'laba_rugi' => $laba,
        ];

        // ✅ Generate PDF
        $pdf = Pdf::loadView('reports.laba-rugi-pdf', [
            'data' => $data,
            'type' => $type,
            'bulan' => $bulan,
            'tahun' => $tahun,
        ])->setPaper('a4', 'portrait');

        return $pdf->stream('laporan-laba-rugi.pdf');
    }

}
