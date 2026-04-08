<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePurchaseRequest;
// use App\Http\Requests\UpdatePurchaseRequest;
use App\Models\Purchase;
use App\Models\Supplier;
use Illuminate\Http\Request;
use App\Services\PurchasesReportService;
use Inertia\Inertia;

class PurchasesReportController extends Controller
{
    public function __construct(
        private PurchasesReportService $service
    ) {}

    public function index()
    {
        $pagination = $this->service->getPurchases(); 
        return Inertia::render('reports/purchasing/index', compact('pagination'));
    }
    public function destroy(Purchase $purchase)
    {
        $this->service->delete($purchase);
        return to_route('reports.purchases.index')->with('success', 'Metode pembayaran berhasil dihapus');
    }

    public function store(Request $request)
    {
        $this->service->store($request->all());

        return to_route('reports.purchasing.index')
            ->with('success', 'Data berhasil ditambahkan');
    }

    public function restore(int $id)
    {
        $this->service->restore($id);
        return to_route('reports.purchases.index')->with('success', 'Kategori berhasil dipulihkan');
    }

    public function deleted(){
        $onlyTrashed = true;
        $pagination = $this->service->getDeletedMethod();
        return Inertia::render('reports/purchasing/index', compact('pagination', 'onlyTrashed'));
    }
}
