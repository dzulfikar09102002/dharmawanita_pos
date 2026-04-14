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
        'details.purchase' => function ($q) {
            $q->withTrashed()->with([
                'product' => function ($q2) {
                    $q2->withTrashed();
                }
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

        // total
        $total = $isDeleted
            ? $transactions->sum('total_amount')
            : $transactions->sum('grand_total');

        // 🔥 render blade ke PDF
        $pdf = Pdf::loadView('reports.sales-pdf', [
            'bulan' => $bulan,
            'tahun' => $tahun,
            'type' => $type,
            'transactions' => $transactions,
            'total' => $total,
            'isDeleted' => $isDeleted,
        ]);

        // optional setting
        $pdf->setPaper('A4', 'portrait');

        // 🔥 STREAM (buka di browser)
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
