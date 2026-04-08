<?php 

namespace App\Services;

use App\Models\SaleTransaction;

class SalesReportService
{
    public function getSalesReport()
    {
        $search = request('search', '');
        $query = SaleTransaction::where(function ($q) use ($search) {
                $q->whereLike('invoice_number', "%$search%");
            });

        return $query
            ->paginate(request('per_page', 10))
            ->withQueryString();
    }
}