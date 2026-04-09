<?php

namespace App\Services;

use App\Models\Product;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use App\Models\SaleTransactionDetail;

class DashboardService
{
    public function getExpiredProducts()
    {
        return Product::query()
            ->whereNotNull('expired_date') 
            ->whereDate('expired_date', '>=', Carbon::today()) 
            ->orderBy('expired_date', 'asc') 
            ->limit(5) 
            ->get();
    }

    public function getBestSellingProducts()
{
    return SaleTransactionDetail::query()
        ->select('product_id', DB::raw('SUM(quantity) as total_sold'))
        ->with('product')
        ->groupBy('product_id')
        ->orderByDesc('total_sold')
        ->limit(5)
        ->get();
}

    // public function getDeletedCategories()
    // {
    //     $search = request('search', '');
    //     $perPage = request('per_page', 10);

    //     return Category::onlyTrashed()
    //         ->when($search, function ($query) use ($search) {
    //             $query->where('name', 'like', "%{$search}%");
    //         })
    //         ->paginate($perPage)
    //         ->withQueryString();
    // }

    // public function store(array $input)
    // {
    //     $user = auth()->user();
    //     return Category::create([
    //         'name'       => $input['name'],
    //         'created_by' => $user->id,
    //         'updated_by' => $user->id,
    //     ]);
    // }

    // public function update(Category $category, array $input)
    // {
    //     return $category->update([
    //         'name'       => $input['name'],
    //         'updated_by' => auth()->user()->id,
    //     ]);
    // }

    // // Hapus kategori
    // public function delete(Category $category)
    // {
    //     $category->update([
    //         'deleted_by' => auth()->user()->id,
    //     ]);

    //     return $category->delete(); 
    // }

    // public function restore(int $id)
    // {
    //     $category = Category::withTrashed()->findOrFail($id);
    //     return $category->restore();
    // }

    // public function getCategoryOptions()
    // {
    //     return Category::select('id', 'name')->get();
    // }
}