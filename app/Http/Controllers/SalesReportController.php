<?php

namespace App\Http\Controllers;
use App\Services\SalesReportService;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\models\SaleTransaction;

class SalesReportController extends Controller
{
    public function __construct(
        protected SalesReportService $service
    ) {}

    public function index()
    {
        $pagination = $this->service->getSalesReport();
        return Inertia::render('reports/sellings/index', compact('pagination'));
    }

    public function show($id)
    {
        $transaction = SaleTransaction::with('paymentMethod')->findOrFail($id);

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

}
