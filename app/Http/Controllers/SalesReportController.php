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

    public function canceled ()
    {
        $pagination = $this->service->getCanceledMethod();
        return Inertia::render('reports/sellings/index', compact('pagination'));

    }
    public function deleted(){
        $onlyTrashed = true;
        $pagination = $this->service->getDeletedMethod();
        return Inertia::render('reports/sellings/index', compact('pagination'));
    }

public function printSalesReport(Request $request)
{
    $isDeleted  = $request->boolean('deleted');
    $isCanceled = $request->boolean('canceled');

    $type  = $request->type ?? 'month'; // month | week | year
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
                    'inventoryTransactions',
                    'returnTransaction',
                ]);
            }
        ]);

    // FILTER STATUS
    if ($isCanceled) {
        $query->where('payment_status','canceled');
    } elseif ($isDeleted) {
        $query->onlyTrashed();
    } else {
        $query->where('payment_status','!=','canceled');
    }

    // FILTER PERIODE
    if ($type === 'month' || $type === 'week') {
        $query->whereMonth('transaction_date', $bulan)
              ->whereYear('transaction_date', $tahun);
    } else {
        $query->whereYear('transaction_date', $tahun);
    }

    $transactions = $query
        ->orderBy('transaction_date')
        ->get();

    // REASON
    $transactions->each(function ($item) use ($isCanceled) {

        if ($isCanceled) {

            $return = $item->details
                ->flatMap(fn($d) => $d->returnTransaction)
                ->first();

            $item->reason = $return?->note;

        } else {

            $inventory = $item->details
                ->flatMap(fn($d) => $d->inventoryTransactions)
                ->first();

            $item->reason = $inventory?->note;
        }

    });

    /*
    |--------------------------------------------------------------------------
    | WEEKLY GROUPING
    |--------------------------------------------------------------------------
    */
    $weeklyTotals = [];

    if ($type === 'week') {

        $transactions = $transactions
            ->sortBy('transaction_date')
            ->groupBy(function ($trx) {
                return ceil(
                    \Carbon\Carbon::parse(
                        $trx->transaction_date
                    )->day / 7
                );
            });

        foreach ($transactions as $week => $items) {

            $weeklyTotals[$week] = $isDeleted
                ? (float) $items->sum('total_amount')
                : (float) $items->sum(function ($trx) {
                    return (float)(
                        $trx->total_amount - ($trx->change ?? 0)
                    );
                });
        }
    }

    /*
    |--------------------------------------------------------------------------
    | GRAND TOTAL
    |--------------------------------------------------------------------------
    */
    $flatTransactions = collect($transactions)->flatten();

    $total = $isDeleted
        ? (float) $flatTransactions->sum('total_amount')
        : (float) $flatTransactions->sum(function ($trx) {
            return (float)(
                $trx->total_amount - ($trx->change ?? 0)
            );
        });

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

    // PERIODE
    if ($type === 'month') {

        $periode =
            ($namaBulan[(int)$bulan] ?? '-') . ' ' . $tahun;

    } elseif ($type === 'week') {

        $periode =
            'Per Minggu - ' .
            ($namaBulan[(int)$bulan] ?? '-') .
            ' ' . $tahun;

    } else {

        $periode = $tahun;
    }

    // TITLE
    $title = $isDeleted
        ? 'Laporan Barang Rusak / Expired'
        : (
            $isCanceled
                ? 'Laporan Pembatalan'
                : 'Laporan Penjualan'
        );

    $title .= ' - '.$periode;


    $pdf = Pdf::loadView(
        'reports.sales-pdf',
        [
            'bulan'        => $bulan,
            'tahun'        => $tahun,
            'type'         => $type,
            'transactions' => $transactions,
            'weeklyTotals' => $weeklyTotals,
            'total'        => $total,
            'isCanceled'   => $isCanceled,
            'isDeleted'    => $isDeleted,
            'title'        => $title,
        ]
    )->setPaper('A4','landscape');


    return $pdf->stream(
        $isDeleted
            ? "laporan-kerugian-{$bulan}-{$tahun}.pdf"
            : (
                $isCanceled
                    ? "laporan-pembatalan-{$bulan}-{$tahun}.pdf"
                    : "laporan-penjualan-{$bulan}-{$tahun}.pdf"
            )
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
