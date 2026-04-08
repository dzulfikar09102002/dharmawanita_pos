<?php

namespace App\Services;

use App\Models\Purchase;

class PurchasesReportService
{
    public function getPurchases()
{
    $search = request('search', '');

    return Purchase::with(['product', 'supplier'])
        ->when($search, function ($query) use ($search) {
            $query->where(function ($q) use ($search) {
                $q->whereHas('product', function ($q2) use ($search) {
                    $q2->where('name', 'like', "%$search%");
                })->orWhereHas('supplier', function ($q2) use ($search) {
                    $q2->where('name', 'like', "%$search%");
                });
            });
        })
        ->paginate(request('per_page', 10))
        ->withQueryString();
}

    public function getDeletedMethod()
{
    $search = request('search', '');

    return Purchase::onlyTrashed()
        ->with(['product', 'supplier']) 
        ->when($search, function ($query) use ($search) {
            $query->where(function ($q) use ($search) {
                $q->whereHas('product', function ($q2) use ($search) {
                    $q2->where('name', 'like', "%$search%");
                })->orWhereHas('supplier', function ($q2) use ($search) {
                    $q2->where('name', 'like', "%$search%");
                });
            });
        })
        ->paginate(request('per_page', 10))
        ->withQueryString();
}

     public function delete(Purchase $purchasereport)
    {
        return $purchasereport->delete();
    }

    public function restore(int $id){
        $purchasereport = Purchase::withTrashed()->findOrFail($id);
        return $purchasereport->restore();
    }
}