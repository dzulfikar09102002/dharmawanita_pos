<?php 

namespace App\Services;

use App\Models\SaleTransaction;
use App\Models\Purchase;
use App\Models\Product;
use App\Models\Category;

class LabaRugiService
{
    public function getLabaRugi()
    {
        $search = request('search', '');
        $category_id = request('category_id', 'all');

        $query = Product::query()
            ->with('category')

            // ✅ TOTAL SALES (VALID)
            ->withSum([
                'saleDetails as total_sales' => function (Builder $q) {
                    $q->whereHas('saleTransaction', function ($trx) {
                        $trx->where(function ($q) {
                            $q->where('payment_status', 'paid')
                            ->orWhereColumn('created_at', '!=', 'updated_at');
                        });
                    })
                    ->selectRaw('SUM(selling_price * quantity)');
                }
            ], '')

            // ✅ TOTAL PURCHASE
            ->withSum([
                'purchases as total_purchase' => function (Builder $q) {
                    $q->selectRaw('SUM(purchase_price * quantity)');
                }
            ], '')

            ->when($search, function ($q) use ($search) {
                $q->where('name', 'like', "%$search%");
            })

            ->when($category_id !== 'all', function ($q) use ($category_id) {
                $q->where('category_id', $category_id);
            });

        $products = $query
            ->paginate(request('per_page', 10))
            ->withQueryString();

        // ✅ PROFIT
        $products->getCollection()->transform(function ($product) {
            $product->profit = ($product->total_sales ?? 0) - ($product->total_purchase ?? 0);
            return $product;
        });

        return $products;
    }
    
}