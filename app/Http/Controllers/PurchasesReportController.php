<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Purchase;
use Illuminate\Http\Request;
use App\Services\PurchasesReportService;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf;

class PurchasesReportController extends Controller
{
    public function __construct(
        private PurchasesReportService $service
    ) {}

    public function index(Request $request)
    {
        $month = $request->get('month', now()->month);
        $year  = $request->get('year', now()->year);

        $pagination = $this->service->getPurchases();

        return Inertia::render('reports/purchasing/index', [
            'pagination' => $pagination,
            'onlyTrashed' => false,
            'month' => (int) $month,
            'year' => (int) $year,
        ]);
    }

    public function destroy(Purchase $purchase)
    {
        $this->service->delete($purchase);

        return to_route('reports.purchases.index', request()->only('search', 'month', 'year'))
            ->with('success', 'Data berhasil dihapus');
    }

    public function restore(int $id)
    {
        $this->service->restore($id);

        return to_route('reports.purchases.deleted', request()->only('search', 'month', 'year'))
            ->with('success', 'Data berhasil dipulihkan');
    }

    public function deleted(Request $request)
    {
        $month = $request->get('month', now()->month);
        $year  = $request->get('year', now()->year);

        $pagination = $this->service->getDeletedMethod();

        return Inertia::render('reports/purchasing/index', [
            'pagination' => $pagination,
            'onlyTrashed' => true,
            'month' => (int) $month,
            'year' => (int) $year,
        ]);
    }

  public function printPurchasesReport(Request $request)
{
    $type = $request->type ?? 'month';
    $bulan = $request->bulan ?? now()->month;
    $tahun = $request->tahun ?? now()->year;

    if (!$tahun) {
        abort(400, 'Tahun wajib diisi');
    }

    $query = Purchase::with([
        'product',
        'supplier'
    ]);

    // 🔥 FILTER BULAN
    if ($type === 'month') {
        if (!$bulan) {
            abort(400, 'Bulan wajib diisi untuk laporan bulanan');
        }

        $query->whereMonth('purchase_date', $bulan)
              ->whereYear('purchase_date', $tahun);
    }

    // 🔥 FILTER TAHUN
    if ($type === 'year') {
        $query->whereYear('purchase_date', $tahun);
    }

    $transactions = $query->latest('purchase_date')->get();

    // 🔥 TOTAL (exclude canceled kalau ada status)
    $total = $transactions
    ->where('status_payment', '!=', 'canceled')
    ->sum(function ($item) {
        return (float) ($item->total_payment ?? 0);
    });

    // 🔥 FORMAT PERIODE (SAMA KAYAK SALES)
    if ($type === 'month') {
        $namaBulan = [
            1 => 'Januari', 2 => 'Februari', 3 => 'Maret',
            4 => 'April', 5 => 'Mei', 6 => 'Juni',
            7 => 'Juli', 8 => 'Agustus', 9 => 'September',
            10 => 'Oktober', 11 => 'November', 12 => 'Desember'
        ];

        $periode = ($namaBulan[(int)$bulan] ?? '-') . ' ' . $tahun;
    } else {
        $periode = $tahun;
    }

    // 🔥 TITLE FIX
    $title = 'Laporan Pembelian - ' . $periode;

    $pdf = Pdf::loadView('reports.purchase-pdf', [
        'transactions' => $transactions,
        'total' => $total,
        'type' => $type,
        'bulan' => $bulan,
        'tahun' => $tahun,
        'title' => $title, 
    ])->setPaper('a4', 'landscape');

    return $pdf->stream("laporan-pembelian-{$bulan}-{$tahun}.pdf");
}

public function pay(Purchase $purchase)
    {
        $this->service->pay($purchase, request()->all());

        return back()->with('success', 'Pembayaran berhasil');
    }
}