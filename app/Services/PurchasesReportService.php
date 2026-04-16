<?php

namespace App\Services;

use App\Models\InventoryTransaction;
use App\Models\Purchase;
use Illuminate\Support\Facades\DB;

class PurchasesReportService
{
    public function getPurchases()
    {
        $search = request('search', '');
        $month = request('month');
        $year  = request('year');

        return Purchase::with(['product', 'supplier'])
            ->when($search, function ($query) use ($search) {
                $query->where(function ($q) use ($search) {
                    
                    $q->where('purchases.code', 'like', "%{$search}%") // ✅ TAMBAH INI
                    
                    ->orWhereHas('product', function ($q2) use ($search) {
                        $q2->where('name', 'like', "%{$search}%");
                    })
                    ->orWhereHas('supplier', function ($q2) use ($search) {
                        $q2->where('name', 'like', "%{$search}%");
                    });
                });
            })

            // ✅ FILTER BULAN
            ->when($month, function ($query) use ($month) {
                $query->whereMonth('purchase_date', $month);
            })

            // ✅ FILTER TAHUN
            ->when($year, function ($query) use ($year) {
                $query->whereYear('purchase_date', $year);
            })
            ->orderByRaw("
                CASE 
                    WHEN status_payment = 'canceled' THEN 1
                    ELSE 0
                END
            ")
            ->orderByDesc('updated_at')
            ->orderByDesc('created_at')
            ->paginate(request('per_page', 10))
            ->withQueryString();
    }

    public function getDeletedMethod()
    {
        $search = request('search', '');
        $month = request('month');
        $year  = request('year');

        return Purchase::onlyTrashed()
            ->with(['product', 'supplier'])

            ->when($search, function ($query) use ($search) {
                $query->where(function ($q) use ($search) {
                    $q->whereHas('product', function ($q2) use ($search) {
                        $q2->where('name', 'like', "%{$search}%");
                    })
                    ->orWhereHas('supplier', function ($q2) use ($search) {
                        $q2->where('name', 'like', "%{$search}%");
                    });
                });
            })

            // ✅ FILTER BULAN
            ->when($month, function ($query) use ($month) {
                $query->whereMonth('purchase_date', $month);
            })

            // ✅ FILTER TAHUN
            ->when($year, function ($query) use ($year) {
                $query->whereYear('purchase_date', $year);
            })

            ->paginate(request('per_page', 10))
            ->withQueryString();
    }

    public function delete(Purchase $purchasereport)
    {
        DB::transaction(function () use ($purchasereport) {

            $purchasereport->update([
                'status_payment' => 'canceled',
                'updated_by'     => auth()->id()
            ]);

            InventoryTransaction::create([
                'product_id'     => $purchasereport->product_id,
                'type'           => 'out',
                'source'         => 'return',
                'reference_id'   => $purchasereport->id,
                'quantity'       => $purchasereport->quantity,
                'purchase_price' => $purchasereport->purchase_price ?? 0,
                'selling_price'  => $purchasereport->selling_price ?? 0,
                'note'           => 'Purchase dibatalkan',
                'created_by'     => auth()->id(),
            ]);
        });

        return back();
    }

    public function restore(int $id)
    {
        $purchasereport = Purchase::withTrashed()->findOrFail($id);
        return $purchasereport->restore();
    }


public function pay(Purchase $purchase, array $input): Purchase
{
    return DB::transaction(function () use ($purchase, $input) {

        $purchase = Purchase::whereKey($purchase->id)
            ->where('status_payment', '!=', 'paid')
            ->lockForUpdate()
            ->firstOrFail();

        $orderTotal = $purchase->purchase_price * $purchase->quantity;

        $payAmount = (float) ($input['total_payment'] ?? 0);

        $alreadyPaid = (float) ($purchase->total_payment ?? 0);

        $newPaid = $alreadyPaid + $payAmount;

        if ($newPaid > $orderTotal) {
            $newPaid = $orderTotal;
        }

        $remaining = $orderTotal - $newPaid;

        $purchase->update([
            'total_payment' => $newPaid,
            'status_payment' => $remaining == 0 ? 'paid' : 'pending',
            'updated_by' => auth()->id(),
        ]);

        return $purchase->fresh();
    });
}
}