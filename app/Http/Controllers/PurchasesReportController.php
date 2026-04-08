<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePurchaseRequest;
use App\Http\Requests\UpdatePurchaseRequest;
use App\Models\Purchase;
use App\Models\Supplier;
use Illuminate\Http\Request;
use App\Services\PurchasesReportService;
use Inertia\Inertia;

class PurchaseController extends Controller
{
    public function __construct(
        private PurchasesReportService $service
    ) {}

    public function index()
    {
        $pagination = $this->service->getPurchases(); 
        return Inertia::render('purchases/index', compact('pagination'));
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
