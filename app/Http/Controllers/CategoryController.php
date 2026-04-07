<?php

namespace App\Http\Controllers;

use App\Services\CategoryService;

class CategoryController extends Controller
{
    public function __construct(
        private CategoryService $service
    ) {}

    public function index()
    {
        $categories = $this->service->getCategories();
        
        return response()->json([
            'data' => $categories
        ]);
    }
}