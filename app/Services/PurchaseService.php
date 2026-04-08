<?php

namespace App\Services;

use App\Models\Category;
use App\Models\Product;
use App\Models\Purchase;

class PurchaseService
{
    public function getProducts()
    {
        $search = request('search', '');
        $category_id = request('product_category_id', 'all');

        $query = Product::with('category')
            ->when($search, function ($query) use ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%$search%")
                    ->orWhereHas('category', function ($q2) use ($search) {
                        $q2->where('name', 'like', "%$search%");
                    });
                });
            });

        if ($category_id !== 'all') {
            $query->where('category_id', $category_id);
        }

        return $query
            ->orderByDesc('updated_at')
            ->paginate(request('per_page', 10))
            ->withQueryString();
    }

    public function getCategoryOptions()
    {
        $options = Category::all()->map(function ($category) {
            return [
                'value' => $category->id,
                'label' => $category->name,
            ];
        });

        $options->prepend([
            'value' => 'all',
            'label' => 'Semua kategori',
        ]);

        return $options;
    }

    public function getDeletedMethod()
    {
        $search = request('search', '');

        return Purchase::onlyTrashed()
            ->whereLike('name', "%$search%")
            ->paginate(request('per_page', 10))
            ->withQueryString();
    }

    public function store(array $input)
    {
        $user = auth()->user();

        return Purchase::create([
            'name'        => $input['name'],
            'contact'     => $input['contact'],
            'address'     => $input['address'],
            'created_by'  => $user->id,
            'updated_by'  => $user->id,
        ]);
    }

    public function update(Purchase $purchase, array $input)
    {
        return $purchase->update([
            'name'        => $input['name'],
            'contact'     => $input['contact'],
            'address'     => $input['address'],
            'updated_by'  => auth()->user()->id,
        ]);
    }

     public function delete(Purchase $purchase)
    {
        return $purchase->delete();
    }

    public function restore(int $id){
        $purchase = Purchase::withTrashed()->findOrFail($id);
        return $purchase->restore();
    }
}