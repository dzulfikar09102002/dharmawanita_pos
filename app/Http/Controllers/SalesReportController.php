<?php

namespace App\Http\Controllers;
use App\Services\SalesReportService;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class SalesReportController extends Controller
{
    public function __construct(
        protected SalesReportService $service
    ) {}

    public function index()
    {
        $pagination = $this->service->getSalesReport();
        dd($pagination);
        return Inertia::render('reports/sellings/summary', compact('pagination'));
    }

    
}
