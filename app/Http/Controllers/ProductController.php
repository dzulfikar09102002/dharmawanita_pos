<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Services\ProductService;
use Inertia\Inertia;

class ProductController extends Controller
{
     public function __construct(
        private ProductService $service
    ) {}
    
    public function index()
    {
        $pagination = $this->service->getProducts();
        $categoryOptions = $this->service->getCategoryOptions();

        return response()->json([
            'pagination' => $pagination,
            'categoryOptions' => $categoryOptions
        ]);
    }

    public function store(StoreProductRequest $request)
    {
        $this->service->store($request->validated());

        return to_route('product-categories.index')
            ->with('success', 'Produk berhasil ditambahkan');
    }
}
