<?php 

namespace App\Services;

use App\Models\SaleTransaction;
use App\Models\SaleTransactionDetail;
use App\Models\PaymentMethod;
use App\Models\Product;

class SalesReportService
{
    
    public function getSalesReport()
    {
        $search = request('search', '');
        $payment_method_id = request('payment_method_id', 'all');
        $query = SaleTransaction::with('paymentMethod')
            ->where(function ($q) use ($search) {
                $q->whereLike('invoice_number', "%$search%");
            });

        if ($payment_method_id !== 'all') {
            $query->where('payment_method_id', $payment_method_id);
        }

        return $query
            ->paginate(request('per_page', 10))
            ->withQueryString();
    }

    public function getDetailSalesReport(int $id)
    {

        $query = SaleTransactionDetail::with('product')
        ->where('sale_transaction_id', $id);

         return $query
            ->paginate(request('per_page', 10))
            ->withQueryString();
    }
}