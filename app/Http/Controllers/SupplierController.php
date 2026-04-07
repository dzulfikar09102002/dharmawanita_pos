<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Services\SupplierService;

class SupplierController extends Controller
{
    public function __construct(
        private SupplierService $service
    ) {}

    public function index()
    {
        $pagination = $this->service->getSuppliers();

        return Inertia::render('suppliers/index', compact('pagination'));
    }
}
