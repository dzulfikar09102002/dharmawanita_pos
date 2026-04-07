<?php 

namespace App\Services;

use App\Models\Product;
use App\Models\Category;

class ProductService
{
    public function getProducts()
    {
        $search = request('search', '');
        $product_category_id = request('category_id', 'all');
        $query = Product::with('category')
            ->where(function ($q) use ($search) {
                $q->whereLike('name', "%$search%");
            });

        if ($product_category_id !== 'all') {
            $query->where('category_id', $product_category_id);
        }

        return $query
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

    public function store(array $data)
    {
        $user = auth()->user();

        return Product::create([
            'category_id' => $data['category_id'],
            'name' => $data['name'],
            'brand' => $data['brand'], 
            'has_expired' => $data['has_expired'],
            'created_by' => $user?->id, 
        ]);
    }
}