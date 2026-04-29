<?php 

namespace App\Services;

use App\Models\CashLedger;
use App\Models\InventoryTransaction;
use App\Models\SaleTransaction;
use App\Models\SaleTransactionDetail;
use App\Models\PaymentMethod;
use App\Models\Product;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
class SalesReportService
{
    
    public function getSalesReport(?int $bulan = null, ?int $tahun = null)
    {
        $search = request('search', '');
        $payment_method_id = request('payment_method_id', 'all');

        $query = SaleTransaction::with('paymentMethod');

        // 🔥 Kalau search ada → ambil tanggal dari invoice
        if ($search) {
            $invoice = SaleTransaction::whereLike('invoice_number', "%$search%")
                ->orderByDesc('transaction_date')
                ->first();

            if ($invoice) {
                $date = \Carbon\Carbon::parse($invoice->transaction_date);
                $bulan = $date->month;
                $tahun = $date->year;
            }

            $query->whereLike('invoice_number', "%$search%");
        }

        if (!is_null($bulan)) {
            $query->whereMonth('transaction_date', $bulan);
        }

        if (!is_null($tahun)) {
            $query->whereYear('transaction_date', $tahun);
        }

        if ($payment_method_id !== 'all') {
            $query->where('payment_method_id', $payment_method_id);
        }

        return [
            'data' => $query
            ->where('payment_status', '!=', 'canceled')
                ->orderByRaw("
                    CASE 
                        WHEN payment_status = 'canceled' THEN 1
                        ELSE 0
                    END
                ")
                ->orderByDesc('transaction_date') 
                ->paginate(request('per_page', 10))
                ->withQueryString(),

            'bulan' => $bulan,
            'tahun' => $tahun,
        ];
    }

    public function getDetailSalesReport(int $id)
    {
        $query = SaleTransactionDetail::with([
            'purchase' => function ($q) {
                $q->withTrashed()->with([
                    'product' => function ($q2) {
                        $q2->withTrashed();
                    },
                    'supplier' => function ($q2) {
                        $q2->withTrashed();
                    }
                ]);
            },
            'returnTransaction'
        ])
        ->where('sale_transaction_id', $id);

        return $query
            ->paginate(request('per_page', 10))
            ->withQueryString();
    }

    public function cancel(int $id)
    {
        return DB::transaction(function () use ($id) {

            $invoice = SaleTransaction::with('details.purchase')->findOrFail($id);

            $reason = request('reason');

            $invoice->update([
                'payment_status' => 'canceled',
                'updated_by'     => auth()->id(),
            ]);

            foreach ($invoice->details as $detail) {

                if (!$detail->purchase) {
                    throw new \Exception("Produk tidak ditemukan untuk detail ID: {$detail->id}");
                }
                InventoryTransaction::create([
                    'product_id'      => $detail->purchase->product_id,
                    'type'            => 'in',
                    'source'          => 'return',
                    'reference_id'    => $detail->id,
                    'reference_table' => 'sale',
                    'quantity'        => $detail->quantity,
                    'purchase_price'  => $detail->purchase->purchase_price ?? 0,
                    'selling_price'   => $detail->selling_price ?? 0,
                    'note'            => $reason
                        ? "Return: {$reason}"
                        : 'Transaksi dibatalkan (return)',
                    'created_by'      => auth()->id(),
                ]);
            }

            $totalPaid = $invoice->total_amount - $invoice->change;
            if ($totalPaid > 0) {
                CashLedger::create([
                    'transaction_date' => now(),
                    'type'             => CashLedger::TYPE_OUT,
                    'category'         => CashLedger::CATEGORY_ADJUSTMENT,
                    'amount'           => $totalPaid,
                    'description'      => 'PEMBATALAN PENJUALAN INVOICE' . $invoice->invoice_number,
                    'reference_table'  => CashLedger::REF_SALE,
                    'reference_id'     => $invoice->id,
                    'created_by'       => auth()->id(),
                    'updated_by'       => auth()->id(),
                ]);
            }
            return true;
        });
    }
    public function getCanceledMethod()
    {
        $search = request('search', '');

        $data = SaleTransaction::with([
                'paymentMethod',
                'details.inventoryTransactions'
            ])
            ->when($search, function ($q) use ($search) {
                $q->where('invoice_number', 'like', "%$search%");
            })
            ->orderByDesc('transaction_date')
            ->where('payment_status', 'canceled')
            ->paginate(request('per_page', 10))
            ->withQueryString();

        $data->getCollection()->transform(function ($item) {

            $item->reason = optional(
                $item->details
                    ->flatMap(fn ($d) => $d->inventoryTransactions)
                    ->first()
            )->note;

            return $item;
        });

        return $data;
    }

    public function getDeletedMethod()
    {
        $search = request('search', '');

        $data = SaleTransaction::onlyTrashed()
            ->with([
                'paymentMethod',
                'details.inventoryTransactions'
            ])
            ->when($search, function ($q) use ($search) {
                $q->where('invoice_number', 'like', "%$search%");
            })
            ->orderByDesc('transaction_date')
            ->paginate(request('per_page', 10))
            ->withQueryString();

        $data->getCollection()->transform(function ($item) {

            $item->reason = optional(
                $item->details
                    ->flatMap(fn ($d) => $d->inventoryTransactions)
                    ->first()
            )->note;

            return $item;
        });

        return $data;
    }

     public function delete(SaleTransaction $salereport)
    {
        return $salereport->delete();
    }

    public function restore(int $id){
        $salereport = SaleTransaction::withTrashed()->findOrFail($id);
        return $salereport->restore();
    }

    public function getSaleTransaction(int $id): SaleTransaction
    {
        return SaleTransaction::where('id', $id)
            ->where('payment_status', 'pending') // hanya bisa dilunasi kalau pending
            ->firstOrFail();
    }

    public function getTransactionDetails(int $id)
    {
        return SaleTransactionDetail::with([
            'purchase.product'
        ])
        ->where('sale_transaction_id', $id)
        ->get();
    }

    public function getPaymentMethods()
    {
        return PaymentMethod::whereRaw('LOWER(kind) != ?', ['cash'])->get();
    }
}