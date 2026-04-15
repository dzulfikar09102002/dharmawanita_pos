<?php

namespace App\Http\Controllers;
use App\Services\SalesReportService;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\models\SaleTransaction;
use Barryvdh\DomPDF\Facade\Pdf;

class SalesReportController extends Controller
{
    public function __construct(
        protected SalesReportService $service
    ) {}

    public function index()
    {
        $bulan = request('bulan', now()->month);
        $tahun = request('tahun', now()->year);

        $result = $this->service->getSalesReport($bulan, $tahun);

        return Inertia::render('reports/sellings/index', [
            'pagination' => $result['data'],
            'bulan' => $result['bulan'],  
            'tahun' => $result['tahun'], 
        ]);
    }

    public function show($id)
    {
        $transaction = SaleTransaction::withTrashed()
            ->with('paymentMethod')
            ->findOrFail($id);

        $pagination = $this->service->getDetailSalesReport($id);

        return Inertia::render('reports/sellings/detail', [
            'pagination' => $pagination,
            'transaction' => $transaction,
        ]);
    }

     public function cancel($id)
    {
        $this->service->cancel($id);
    return to_route('reports.sales.index')->with('success', 'Transaksi berhasil dibatalkan');
    }

    public function destroy(SaleTransaction $sale)
    {
        $sale->delete();

        return to_route('reports.sales.index')
            ->with('success', 'Transaksi berhasil dihapus');
    }

     public function restore(int $id)
    {
        $this->service->restore($id);
        return to_route('reports.sales.index')->with('success', 'Transaksi berhasil dipulihkan');
    }

    public function deleted(){
        $onlyTrashed = true;
        $pagination = $this->service->getDeletedMethod();
        return Inertia::render('reports/sellings/index', compact('pagination', 'onlyTrashed'));
    }

   public function printSalesReport(Request $request)
{
    $isDeleted = $request->boolean('deleted');

    $type = $request->type ?? 'month';
    $bulan = $request->bulan ?? now()->month;
    $tahun = $request->tahun ?? now()->year;

    $query = SaleTransaction::query()
        ->with([
            'details' => function ($q) {
                $q->with([
                    'purchase' => function ($q2) {
                        $q2->withTrashed()->with([
                            'product' => function ($q3) {
                                $q3->withTrashed();
                            }
                        ]);
                    },
                    'inventoryTransactions' // 🔥 pastikan relasi ini bener
                ]);
            }
        ]);

    if ($isDeleted) {
        $query->onlyTrashed();
    }

    // filter periode
    if ($type === 'month') {
        $query->whereMonth('transaction_date', $bulan)
              ->whereYear('transaction_date', $tahun);
    } else {
        $query->whereYear('transaction_date', $tahun);
    }

    $transactions = $query->get();

    // 🔥 amanin reason
    $transactions->each(function ($item) {
        $inventory = $item->details
            ->flatMap(fn ($d) => $d->inventoryTransactions ?? [])
            ->first();

        $item->reason = $inventory->note ?? null;
    });

    // total
    $total = $isDeleted
        ? (float) $transactions->sum('total_amount')
        : (float) $transactions->sum('grand_total');
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

    $title = ($isDeleted
        ? 'Laporan Barang Rusak / Expired'
        : 'Laporan Penjualan'
    ) . ' - ' . $periode;
    $pdf = Pdf::loadView('reports.sales-pdf', [
        'bulan' => $bulan,
        'tahun' => $tahun,
        'type' => $type,
        'transactions' => $transactions,
        'total' => $total,
        'isDeleted' => $isDeleted,
        'title' => $title, 
    ]);

    $pdf->setPaper('A4', 'portrait');

    return $pdf->stream(
        $isDeleted
            ? "laporan-barang-rusak-{$bulan}-{$tahun}.pdf"
            : "laporan-penjualan-{$bulan}-{$tahun}.pdf"
    );
}

    public function payment(int $id)
    {
        $transaction = $this->service->getSaleTransaction($id);
        $details = $this->service->getTransactionDetails($id);
        $paymentMethods = $this->service->getPaymentMethods();

        return Inertia::render('sellings/payment', compact(
            'transaction',
            'details',
            'paymentMethods'
        ));
    }
}
