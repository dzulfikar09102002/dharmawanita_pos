<?php

namespace App\Services;

use App\Models\Supplier;

class SupplierService
{
    public function getSuppliers()
    {
        $search = request('search', '');
        $query = Supplier::where(function ($q) use ($search) {
                $q->whereLike('name', "%$search%");
            });
            
        return $query
            ->paginate(request('per_page', 10))
            ->withQueryString();
    }

}
