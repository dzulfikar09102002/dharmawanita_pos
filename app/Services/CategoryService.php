<?php

namespace App\Services;

use App\Models\Product;
use App\Models\Category;

class CategoryService
{
     public function getCategories()
    {
        $search = request('search', '');

        $query = Category::query();

        // filter search
        if ($search) {
            $query->where('name', 'like', "%{$search}%");
        }

        // ambil data + pagination
        return $query->paginate(10);
    }

    public function getCategoryOptions()
    {
        return Category::select('id', 'name')->get();
    }
}