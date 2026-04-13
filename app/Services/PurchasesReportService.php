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
                ->where('status_payment', 'pending')
                ->lockForUpdate()
                ->firstOrFail();

            $paidAmount = (int) ($input['total_payment'] ?? 0);

            if ($paidAmount <= 0) {
                throw new \Exception('Nominal pembayaran harus lebih dari 0');
            }

            $purchase->update([
                'total_payment' => $paidAmount,
                'status_payment' => 'paid', 
                'updated_by' => auth()->id(),
            ]);

            return $purchase->fresh();
        });
    }
}