<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdatePurchaseRequest;
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
        $supplierOptions = $this->service->getSupplierOptions();
        $total_purchase = $this->service->getTotalPurchase();
        return Inertia::render('reports/purchasing/index', [
            'pagination' => $pagination,
            'onlyTrashed' => false,
            'month' => (int) $month,
            'year' => (int) $year,
            'supplierOptions' => $supplierOptions,
            'total_purchase' => $total_purchase
        ]);
    }

    public function update(UpdatePurchaseRequest $request, Purchase $purchase)
{
    $this->service->update($purchase, $request->validated());

    return to_route(
        'reports.purchases.index',
        request()->only('search', 'month', 'year', 'page')
    )->with('success', 'Data pembelian berhasil diperbarui');
}
    public function destroy(Purchase $purchase)
    {
        $this->service->delete($purchase);
        return to_route('reports.purchases.index', request()->only('search', 'month', 'year'))
            ->with('success', 'Data berhasil dihapus');
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
    $isDeleted = $request->boolean('deleted');

    $query = Purchase::with([
        'product',
        'supplier',
        'inventoryTransactions',
        'returnTransaction',
    ]);

    if ($isDeleted) {
        $query->onlyTrashed();
    }

    if ($type === 'month' || $type === 'week') {
        $query->whereMonth('purchase_date', $bulan)
              ->whereYear('purchase_date', $tahun);
    } else {
        $query->whereYear('purchase_date', $tahun);
    }

    $transactions = $query
        ->latest('purchase_date')
        ->get();

    $transactions->each(function ($item) use ($isDeleted) {

    $labels = [
        'purchase' => 'Pembelian',
        'sale' => 'Penjualan',
        'adjustment' => 'Penyesuaian',
        'return' => 'Retur',
        'transfer' => 'Transfer',
        'other' => 'Lainnya',
        'damage' => 'Barang Rusak',
        'expired' => 'Kedaluwarsa',
        'consignment' => 'Titipan',
    ];

    if ($isDeleted) {

        $return = $item->returnTransaction?->first();

        $item->reason = $return?->note;

        $item->source_label =
            $labels[$return?->source] ?? '-';

    } else {

        $inventory = $item->inventoryTransactions?->first();

        $item->reason = $inventory?->note;

        $item->source_label =
            $labels[$inventory?->source] ?? '-';
    }

});


    $weeklyTotals = [];

    if ($type === 'week') {

        $transactions = $transactions
            ->sortBy('purchase_date')
            ->groupBy(function ($trx) {
                $date = \Carbon\Carbon::parse($trx->purchase_date);
                return ceil($date->day / 7);
            });

        foreach ($transactions as $week => $items) {

            $weeklyTotals[$week] = $isDeleted
                ? (float) $items->sum('total_payment')
                : (float) $items
                    ->where('status_payment','!=','canceled')
                    ->sum('total_payment');
        }
    }


    $flat = $type === 'week'
        ? collect($transactions)->flatten()
        : $transactions;

    $total = $isDeleted
        ? (float) $flat->sum('total_payment')
        : (float) $flat
            ->where('status_payment','!=','canceled')
            ->sum('total_payment');

    $namaBulan = [
        1=>'Januari',
        2=>'Februari',
        3=>'Maret',
        4=>'April',
        5=>'Mei',
        6=>'Juni',
        7=>'Juli',
        8=>'Agustus',
        9=>'September',
        10=>'Oktober',
        11=>'November',
        12=>'Desember'
    ];

    if ($type === 'month') {
        $periode =
            ($namaBulan[(int)$bulan] ?? '-') . ' ' . $tahun;

    } elseif ($type === 'week') {

        $periode =
            'Per Minggu - ' .
            ($namaBulan[(int)$bulan] ?? '-') .
            ' ' .
            $tahun;

    } else {
        $periode = $tahun;
    }

    $title = $isDeleted
        ? 'Laporan Pembatalan Pembelian - ' . $periode
        : 'Laporan Pembelian - ' . $periode;

    $pdf = Pdf::loadView(
        'reports.purchase-pdf',
        [
            'transactions' => $transactions,
            'weeklyTotals' => $weeklyTotals,
            'total' => $total,
            'type' => $type,
            'bulan' => $bulan,
            'tahun' => $tahun,
            'title' => $title,
            'isDeleted' => $isDeleted,
        ]
    )->setPaper('A3','landscape');


    return $pdf->stream(
        $isDeleted
            ? "laporan-pembatalan-pembelian-{$bulan}-{$tahun}.pdf"
            : "laporan-pembelian-{$bulan}-{$tahun}.pdf"
    );
}
public function pay(Purchase $purchase)
    {
        $this->service->pay($purchase, request()->all());

        return back()->with('success', 'Pembayaran berhasil');
    }
}