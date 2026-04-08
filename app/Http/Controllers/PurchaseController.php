<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePurchaseRequest;
use App\Http\Requests\UpdatePurchaseRequest;
use App\Models\Purchase;
use App\Models\Supplier;
use Illuminate\Http\Request;
use App\Services\PurchaseService;
use Inertia\Inertia;


class PurchaseController extends Controller
{
    public function __construct(
        private PurchaseService $service
    ) {}

    public function index()
    {
        $pagination = $this->service->getProducts(); 
        $categoryOptions = $this->service->getCategoryOptions();
        $supplierOptions = $this->service->getSupplierOptions();
        return Inertia::render('purchases/index', compact('pagination', 'categoryOptions', 'supplierOptions'));
    }
    public function store(StorePurchaseRequest $request)
    {
        dd($request->validated());
        $this->service->store($request->validated());
        return to_route('purchases.index')->with('success', 'Metode pembayaran berhasil diperbarui');
    }
    public function update(UpdatePurchaseRequest $request, Purchase $purchase)
    {
        $this->service->update($purchase, $request->validated());
        return to_route('purchases.index')->with('success', 'Metode pembayaran berhasil diperbarui');
    }
    public function destroy(Purchase $purchase)
    {
        $this->service->delete($purchase);
        return to_route('purchases.index')->with('success', 'Metode pembayaran berhasil dihapus');
    }

    public function restore(int $id)
    {
        $this->service->restore($id);
        return to_route('purchases.index')->with('success', 'Metode pembayaran berhasil dipulihkan');
    }

    public function deleted(){
        $onlyTrashed = true;
        $pagination = $this->service->getDeletedMethod();
        return Inertia::render('purchases/index', compact('pagination', 'onlyTrashed'));
    }
}
