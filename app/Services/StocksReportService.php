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

        return $query->orderByDesc('stock')
            ->paginate(request('per_page', 10))
            ->withQueryString();
    }
public function getStockReportByCategories()
{
    $search = request('search', '');

    $query = DB::table('product_stocks')
        ->select(
            DB::raw('MIN(id) as id'),
            DB::raw('category_name as name'),
            DB::raw("'' as brand"),
            'category_id',
            'category_name',
            DB::raw('0 as purchase_price'),
            DB::raw('0 as selling_price'),
            DB::raw('SUM(total_in) as total_in'),
            DB::raw('SUM(total_out) as total_out'),
            DB::raw('SUM(stock) as stock')
        )
        ->groupBy('category_id', 'category_name');

    if ($search) {
        $query->having('category_name', 'like', "%{$search}%");
    }

    return $query
        ->orderByDesc('stock')
        ->paginate(request('per_page', 10))
        ->withQueryString();
}
}