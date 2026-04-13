<?php

namespace App\Services;
use App\Models\PaymentMethod;
use App\Models\Purchase;
use App\Models\PurchasingMethod;
use App\Models\SaleTransactionDetail;
use App\Models\InventoryTransaction;
use App\Models\Category;
use App\Models\SaleTransaction;
use Illuminate\Support\Facades\DB;

class SellingService
{
    public function getProducts()
{
    $search = request('search', '');
    $category_id = request('product_category_id', 'all');
    $stock = \DB::table('inventory_transactions as it')
        ->leftJoin('purchases as p_in', 'p_in.id', '=', 'it.reference_id')
        ->leftJoin('sale_transaction_details as std', 'std.id', '=', 'it.reference_id')
        ->leftJoin('purchases as p_out', 'p_out.id', '=', 'std.purchase_id')
        ->selectRaw('
            COALESCE(p_in.code, p_out.code) as code,
            SUM(
                CASE 
                    WHEN it.type = "in" THEN it.quantity
                    WHEN it.type = "out" THEN -it.quantity
                    ELSE 0
                END
            ) as total_quantity
        ')
        ->whereNull('it.deleted_at')
        ->groupByRaw('COALESCE(p_in.code, p_out.code)');

    $base = Purchase::query()
        ->when($search, function ($query) use ($search) {
    $query->where(function ($q) use ($search) {
        $q->where('purchases.code', 'like', "%$search%")
            ->orWhereHas('product', function ($q2) use ($search) {
                $q2->where('name', 'like', "%$search%");
            });
    });
})
        ->when($category_id !== 'all', function ($query) use ($category_id) {
            $query->whereHas('product', function ($q) use ($category_id) {
                $q->where('category_id', $category_id);
            });
        });

    $query = $base
        ->leftJoinSub($stock, 'stock', function ($join) {
            $join->on('stock.code', '=', 'purchases.code');
        })
        ->selectRaw('
    purchases.code,
    purchases.product_id,

    MAX(purchases.id) as id,

    COALESCE(MAX(stock.total_quantity), 0) as total_quantity,

    MAX(purchases.purchase_price) as purchase_price,
    MAX(purchases.selling_price) as selling_price,
    MAX(purchases.expired_date) as expired_date,
    MAX(purchases.purchase_date) as purchase_date,
    MAX(purchases.updated_at) as updated_at
')
        ->groupBy('purchases.code', 'purchases.product_id')
        ->orderByRaw('
    CASE 
        WHEN COALESCE(MAX(stock.total_quantity), 0) > 0 THEN 0
        ELSE 1
    END
')
->orderByDesc('updated_at');

    return $query
        ->with('product.category')
        ->paginate(request('per_page', 20))
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


    public function store(array $input)
    {
        return DB::transaction(function () use ($input) {

            $items = $input['items'] ?? [];
            $user  = auth()->id();

            $grandTotal = collect($items)->sum(function ($item) {
                return $item['quantity'] * $item['selling_price'];
            });

            $sale = SaleTransaction::create([
                'invoice_number'   => $this->generateInvoiceNumber(),
                'payment_status'   => 'pending',
                'grand_total'      => $grandTotal,
                'transaction_date' => now(),
                'created_by'       => $user,
                'updated_by'       => $user,
            ]);

            foreach ($items as $item) {

                $subtotal = $item['quantity'] * $item['selling_price'];

                $detail = SaleTransactionDetail::create([
                    'sale_transaction_id' => $sale->id,
                    'purchase_id'         => $item['purchase_id'],
                    'code'                => $item['code'],
                    'quantity'            => $item['quantity'],
                    'purchase_price'      => $item['purchase_price'],
                    'selling_price'       => $item['selling_price'],
                    'subtotal'            => $subtotal,
                    'created_by'          => $user,
                    'updated_by'          => $user,
                ]);

                InventoryTransaction::create([
                    'product_id'     => $item['product_id'],
                    'type'           => 'out',
                    'source'         => 'sale',
                    'reference_id'   => $detail->id,
                    'quantity'       => $item['quantity'],
                    'purchase_price' => $item['purchase_price'],
                    'selling_price'  => $item['selling_price'],
                    'note'           => 'Penjualan barang',
                    'created_by'     => $user,
                    'updated_by'     => $user,
                ]);
            }

            return $sale;
        });
    }

    private function generateInvoiceNumber(): string
    {
        $date = now()->format('Ymd');

        $prefix = $date . '/DWPSBY/';

        $last = SaleTransaction::withTrashed()
            ->whereDate('transaction_date', now()->toDateString())
            ->where('invoice_number', 'like', $prefix . '%')
            ->orderByDesc('id')
            ->value('invoice_number');

        $nextNumber = 1;

        if ($last) {
            $lastSequence = (int) substr($last, -3);
            $nextNumber = $lastSequence + 1;
        }

        $sequence = str_pad($nextNumber, 4, '0', STR_PAD_LEFT);

        return $prefix . $sequence;
    }
    public function getTransactionDetails(int $id)
    {
        return SaleTransactionDetail::with('purchase.product')->where('sale_transaction_id', $id)->get();
    }
    public function getSaleTransaction(int $id)
    {
        return SaleTransaction::where('id', $id)
            ->where('payment_status', 'pending')
            ->firstOrFail();
    }
    public function getPaymentMethods()
    {
        return PaymentMethod::whereRaw('LOWER(kind) != ?', ['cash'])->get();
    }
    public function getPurchasingMethod()
    {
        return PurchasingMethod::all();
    }

    
    public function pay(SaleTransaction $sale, array $input): SaleTransaction
    {
        return DB::transaction(function () use ($sale, $input) {

            $sale = SaleTransaction::whereKey($sale->id)
                ->where('payment_status', 'pending')
                ->lockForUpdate()
                ->firstOrFail();

            $methodId = $input['purchase_method_id'];
            $isCancelMethod = $methodId > 3;
            $isPaid = $input['paid_amount'] >= $sale->grand_total;
            $sale->update([
                'payment_method_id' => $input['payment_method_id'] ?? null,
                'total_amount'      => $input['paid_amount'],
                'change'            => $input['change_amount'],
                'purchasing_method_id' => $methodId,
                'payment_status'    => $isCancelMethod
                    ? 'canceled'
                    : ($isPaid ? 'paid' : $sale->payment_status),
                'updated_by'        => auth()->id(),
            ]);

            if ($isCancelMethod) {

                $sourceMap = [
                    4 => 'damage',
                    5 => 'expired',
                    6 => 'other',
                ];

                $newSource = $sourceMap[$methodId] ?? 'other';

                InventoryTransaction::where('source', 'sale')
                    ->whereIn('reference_id', function ($q) use ($sale) {
                        $q->select('id')
                        ->from('sale_transaction_details')
                        ->where('sale_transaction_id', $sale->id);
                    })
                    ->lockForUpdate()
                    ->get()
                    ->each(function ($inventory) use ($newSource, $input) {
                        $inventory->update([
                            'source'     => $newSource,
                            'note'       => $input['reason'] ?? null,
                            'updated_by' => auth()->id(),
                        ]);
                    });
            }

            return $sale->fresh();
        });
    }
}