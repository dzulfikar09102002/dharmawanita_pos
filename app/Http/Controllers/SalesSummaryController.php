<?php

namespace App\Http\Controllers;

use App\Models\SalesSummary;
use App\Http\Requests\StoreSalesSummaryRequest;
use App\Http\Requests\UpdateSalesSummaryRequest;
use App\Services\SalesSummaryService;
use Inertia\Inertia;

class SalesSummaryController extends Controller
{
    public function __construct(
            protected SalesSummaryService $service
        ) {}
    public function index()
    {
        $summary = $this->service->getSalesSummaryToday();
        return Inertia::render('sales-summary/index', compact('summary'));
    }

    public function store(StoreSalesSummaryRequest $request)
    {
        dd($request);
    }

    /**
     * Display the specified resource.
     */
    public function show(SalesSummary $salesSummary)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(SalesSummary $salesSummary)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateSalesSummaryRequest $request, SalesSummary $salesSummary)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(SalesSummary $salesSummary)
    {
        //
    }
}
