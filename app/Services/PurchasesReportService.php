<?php

namespace App\Services;

use App\Models\PurchaseReport;

class PurchasesReportService
{
    public function getPurchases()
    {
        $search = request('search', '');

        return PurchaseReport::with(['product', 'supplier'])
        ->when($search, function ($query) use ($search) {
            $query->whereHas('product', function ($q) use ($search) {
                $q->where('name', 'like', "%$search%");
            })->orWhereHas('supplier', function ($q) use ($search) {
                $q->where('name', 'like', "%$search%");
            });
        })
        ->paginate(request('per_page', 10))
        ->withQueryString();
    }

    public function getDeletedMethod()
    {
        $search = request('search', '');

        return PurchaseReport::onlyTrashed()
            ->whereLike('name', "%$search%")
            ->paginate(request('per_page', 10))
            ->withQueryString();
    }

     public function delete(PurchaseReport $purchasereport)
    {
        return $purchasereport->delete();
    }

    public function restore(int $id){
        $purchasereport = PurchaseReport::withTrashed()->findOrFail($id);
        return $purchasereport->restore();
    }
}