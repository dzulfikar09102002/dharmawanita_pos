<?php 

namespace App\Services;

use App\Models\SaleTransaction;
use App\Models\SaleTransactionDetail;
use App\Models\PaymentMethod;
use App\Models\Product;
use Illuminate\Support\Facades\DB;

class StocksReportService
{
    
   public function getStockReport()
    {
        $search = request('search', '');

        $query = DB::table('product_stocks');

        if ($search) {
            $query->where('name', 'like', "%{$search}%");
        }

        return $query
            ->paginate(request('per_page', 10))
            ->withQueryString();
    }
}