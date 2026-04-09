<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreSellingRequest;
use App\Http\Requests\UpdateSellingRequest;
use App\Models\SaleTransaction;
use App\Models\Selling;
use Illuminate\Http\Request;
use App\Services\SellingService;
use Inertia\Inertia;

class SellingController extends Controller
{
    public function __construct(
        private SellingService $service
    ) {}

    public function index()
    {
        $pagination = $this->service->getProducts(); 
        $categoryOptions = $this->service->getCategoryOptions();
        return Inertia::render('sellings/index', compact('pagination', 'categoryOptions'));
    }
    public function store(StoreSellingRequest $request)
    {
        $this->service->store($request->validated());
        return to_route('sellings.index')->with('success', 'Transaksi berhasil disimpan');
    }
    public function update(UpdateSellingRequest $request, SaleTransaction $selling)
    {
        $this->service->update($selling, $request->validated());
        return to_route('sellings.index')->with('success', 'Transaksi berhasil diperbarui');
    }
    public function destroy(SaleTransaction $selling)
    {
        $this->service->delete($selling);
        return to_route('sellings.index')->with('success', 'Transaksi berhasil dihapus');
    }

    public function restore(int $id)
    {
        $this->service->restore($id);
        return to_route('sellings.index')->with('success', 'Transaksi berhasil dipulihkan');
    }

    public function deleted(){
        $onlyTrashed = true;
        $pagination = $this->service->getDeletedMethod();
        return Inertia::render('sellings/index', compact('pagination', 'onlyTrashed'));
    }
}
