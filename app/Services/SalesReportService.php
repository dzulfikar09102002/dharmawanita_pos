<?php 

namespace App\Services;

use App\Models\SaleTransaction;
use App\Models\SaleTransactionDetail;
use App\Models\PaymentMethod;
use App\Models\Product;
use Carbon\Carbon;
class SalesReportService
{
    
    public function getSalesReport(?int $bulan = null, ?int $tahun = null)
    {
        $search = request('search', '');
        $payment_method_id = request('payment_method_id', 'all');

        $query = SaleTransaction::with('paymentMethod');

        // 🔥 Kalau search ada → ambil tanggal dari invoice
        if ($search) {
            $invoice = SaleTransaction::whereLike('invoice_number', "%$search%")
                ->orderByDesc('transaction_date')
                ->first();

            if ($invoice) {
                $date = \Carbon\Carbon::parse($invoice->transaction_date);
                $bulan = $date->month;
                $tahun = $date->year;
            }

            $query->whereLike('invoice_number', "%$search%");
        }

        if (!is_null($bulan)) {
            $query->whereMonth('transaction_date', $bulan);
        }

        if (!is_null($tahun)) {
            $query->whereYear('transaction_date', $tahun);
        }

        if ($payment_method_id !== 'all') {
            $query->where('payment_method_id', $payment_method_id);
        }

        return [
            'data' => $query
                ->orderByDesc('transaction_date')
                ->paginate(request('per_page', 10))
                ->withQueryString(),

            'bulan' => $bulan,
            'tahun' => $tahun,
        ];
    }

    public function getDetailSalesReport(int $id)
    {
        $query = SaleTransactionDetail::with([
            'purchase' => function ($q) {
                $q->withTrashed()->with([
                    'product' => function ($q2) {
                        $q2->withTrashed();
                    },
                    'supplier' => function ($q2) {
                        $q2->withTrashed();
                    }
                ]);
            }
        ])
        ->where('sale_transaction_id', $id);

        return $query
            ->paginate(request('per_page', 10))
            ->withQueryString();
    }

    public function cancel(int $id)
    {
        $invoice = SaleTransaction::findOrFail($id);
        
        return $invoice->update([
            'payment_status' => 'canceled',
            'updated_by'   => auth()->user()->id,
        ]);
    }

    public function getDeletedMethod()
    {
        $search = request('search', '');

        return SaleTransaction::onlyTrashed()
            ->with('paymentMethod')
            ->when($search, function ($q) use ($search) {
                $q->where('invoice_number', 'like', "%$search%");
            })
            ->paginate(request('per_page', 10))
            ->withQueryString();
    }

     public function delete(SaleTransaction $salereport)
    {
        return $salereport->delete();
    }

    public function restore(int $id){
        $salereport = SaleTransaction::withTrashed()->findOrFail($id);
        return $salereport->restore();
    }
}