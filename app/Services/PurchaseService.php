<?php

namespace App\Services;

use App\Enums\InventorySource;
use App\Enums\InventoryType;
use App\Models\Category;
use App\Models\InventoryTransaction;
use App\Models\Product;
use App\Models\Purchase;
use App\Models\Supplier;
use Illuminate\Support\Facades\DB;

class PurchaseService
{
    public function getProducts()
    {
        $search = request('search', '');
        $category_id = request('product_category_id', 'all');

        $query = Product::with('category')
            ->when($search, function ($query) use ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%$search%")
                    ->orWhereHas('category', function ($q2) use ($search) {
                        $q2->where('name', 'like', "%$search%");
                    });
                });
            });

        if ($category_id !== 'all') {
            $query->where('category_id', $category_id);
        }

        return $query
            ->orderByDesc('updated_at')
            ->paginate(request('per_page', 25))
            ->withQueryString();
    }

    public function getCategoryOptions()
    {
        $options = Category::all()->map(function ($category) {
            return [
                'value' => $category->id,
                'label' => $category->name,
            ];
        });

        $options->prepend([
            'value' => 'all',
            'label' => 'Semua kategori',
        ]);

        return $options;
    }
    public function getSupplierOptions()
    {
        $options = Supplier::all()->map(function ($supplier) {
            return [
                'value' => $supplier->id,
                'label' => $supplier->name,
            ];
        });

        return $options;
    }

    public function store(array $input)
{
    return DB::transaction(function () use ($input) {

        $items = $input['items'] ?? [];
        $createdPurchases = [];
        $user = auth()->id();
        foreach ($items as $item) {
            if($item['source'] == 'purchase')
            {
                $total_payment = $item['purchase_price'];
                $status_payment = 'paid';
            }
            else
            {
                $status_payment = 'pending';
                $total_payment = 0;
            }
            $purchase = Purchase::create([
                'product_id'      => $item['product_id'],
                'supplier_id'     => $item['supplier_id'] ?? null,
                'code'            => $item['code'],
                'year'            => $item['year'],
                'quantity'        => $item['quantity'],
                'purchase_price'  => $item['purchase_price'],
                'selling_price'   => $item['selling_price'],
                'purchase_date'   => $item['purchase_date'],
                'total_payment'   => $total_payment,
                'status_payment'  => $status_payment,
                'expired_date'    => $item['expired_date'] ?? null,
                'created_by'      => $user,
                'updated_by'      => $user,
            ]);
            $product = Product::find($item['product_id']);

            if (!empty($item['expired_date'])) {
                $product->update([
                    'has_expired' => true,
                    'expired_date' => $item['expired_date'],
                ]);
            }
            InventoryTransaction::create([
                'product_id'      => $item['product_id'],
                'type'            => 'in',
                'source'          => $item['source'], 
                'reference_id'    => $purchase->id, 
                'quantity'        => $item['quantity'],
                'purchase_price'  => $item['purchase_price'],
                'selling_price'   => $item['selling_price'],
                'note'            => 'Pembelian barang',
                'created_by'      => $user,
                'updated_by'      => $user,
            ]);
            $createdPurchases[] = $purchase;
        }

        return $createdPurchases;
    });
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