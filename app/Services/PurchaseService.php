<?php

namespace App\Services;

use App\Models\Purchase;

class PurchaseService
{
    public function getPurchases()
    {
        $search = request('search', '');

        return Purchase::with(['product', 'supplier'])
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

        return Purchase::onlyTrashed()
            ->whereLike('name', "%$search%")
            ->paginate(request('per_page', 10))
            ->withQueryString();
    }

    public function store(array $input)
    {
        $user = auth()->user();

        return Purchase::create([
            'name'        => $input['name'],
            'contact'     => $input['contact'],
            'address'     => $input['address'],
            'created_by'  => $user->id,
            'updated_by'  => $user->id,
        ]);
    }

    public function update(Purchase $purchase, array $input)
    {
        return $purchase->update([
            'name'        => $input['name'],
            'contact'     => $input['contact'],
            'address'     => $input['address'],
            'updated_by'  => auth()->user()->id,
        ]);
    }

     public function delete(Purchase $purchase)
    {
        return $purchase->delete();
    }

    public function restore(int $id){
        $purchase = Purchase::withTrashed()->findOrFail($id);
        return $purchase->restore();
    }
}