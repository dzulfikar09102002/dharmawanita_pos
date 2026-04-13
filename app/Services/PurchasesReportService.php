<?php

namespace App\Services;

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
        return $purchasereport->delete();
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

        // total yang harus dibayar (system)
        $orderTotal = $purchase->purchase_price * $purchase->quantity;

        // input user langsung masuk database
        $payAmount = (float) ($input['total_payment'] ?? 0);

        // akumulasi pembayaran sebelumnya
        $alreadyPaid = (float) ($purchase->paid_amount ?? 0);

        $newPaid = $alreadyPaid + $payAmount;

        // tidak boleh lebih dari total order
        if ($newPaid > $orderTotal) {
            $newPaid = $orderTotal;
        }

        $remaining = $orderTotal - $newPaid;

        $purchase->update([
            // ✅ sesuai request: langsung dari input user
            'total_payment' => $payAmount,

            'paid_amount' => $newPaid,
            'remaining_payment' => $remaining,
            'status_payment' => $remaining == 0 ? 'paid' : 'pending',
            'updated_by' => auth()->id(),
        ]);

        return $purchase->fresh();
    });
}
}