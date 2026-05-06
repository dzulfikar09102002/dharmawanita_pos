<?php

namespace App\Services;
use App\Models\CashLedger;
use App\Models\PaymentMethod;
use App\Models\Purchase;
use App\Models\PurchasingMethod;
use App\Models\SaleTransactionDetail;
use App\Models\InventoryTransaction;
use App\Models\Category;
use App\Models\SaleTransaction;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class SellingService
{
    public function getProducts()
{
    $search = request('search', '');
    $category_id = request('product_category_id', 'all');

    /**
     * 🔥 STOCK QUERY FINAL (HANDLE PURCHASE + SALE + RETURN)
     */
    $stock = \DB::table('inventory_transactions as it')

        // 🔥 langsung ke purchase (beli + cancel + return ke supplier)
        ->leftJoin('purchases as p', function ($join) {
            $join->on('p.id', '=', 'it.reference_id')
                ->where('it.reference_table', '=', 'purchase');
        })

        // 🔥 ke sale_transaction_details (jual + return dari customer)
        ->leftJoin('sale_transaction_details as std', function ($join) {
            $join->on('std.id', '=', 'it.reference_id')
                ->where('it.reference_table', '=', 'sale');
        })

        // 🔥 ambil purchase asal dari sale
        ->leftJoin('purchases as p_from_sale', 'p_from_sale.id', '=', 'std.purchase_id')

        ->selectRaw('
            COALESCE(p.code, p_from_sale.code) as code,

            SUM(
                CASE 
                    WHEN it.type = "in" THEN it.quantity
                    WHEN it.type = "out" THEN -it.quantity
                    ELSE 0
                END
            ) as total_quantity
        ')
        ->whereNull('it.deleted_at')

        ->groupByRaw('
            COALESCE(p.code, p_from_sale.code)
        ');

    $base = Purchase::query()
        ->when($search, function ($query) use ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('purchases.code', 'like', "%$search%")
                    ->orWhereHas('product', function ($q2) use ($search) {
                        $q2->where('name', 'like', "%$search%")
                            ->orWhere('brand', 'like', "%$search%");
                    });
            });
        })
        ->when($category_id !== 'all', function ($query) use ($category_id) {
            $query->whereHas('product', function ($q) use ($category_id) {
                $q->where('category_id', $category_id);
            });
        });

    /**
     * 🔥 FINAL QUERY
     */
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
                $subtotal = $item['quantity'] * $item['selling_price'];
                $discount = $item['discount'] ?? 0;

                return $subtotal - $discount;
            });

            $dateInput = Carbon::parse($input['transaction_date']);
            $now = now();

            $dateTime = $dateInput->isSameDay($now)
                ? $now
                : $dateInput->setTimeFrom($now);

            $sale = SaleTransaction::create([
                'invoice_number'   => $this->generateInvoiceNumber($dateInput),
                'payment_status'   => 'pending',
                'grand_total'      => $grandTotal,
                'payment_type'     => 'cash',
                'transaction_date' => $dateTime,
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
                    'adjustment'          => $item['discount'],
                    'created_by'          => $user,
                    'updated_by'          => $user,
                ]);

                InventoryTransaction::create([
                    'product_id'     => $item['product_id'],
                    'type'           => 'out',
                    'source'         => 'sale',
                    'reference_id'   => $detail->id,
                    'reference_table'=> 'sale',
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

    private function generateInvoiceNumber(?string $date = null): string
    {
        $date = $date ? Carbon::parse($date) : now();

        $dateFormat = $date->format('Ymd');
        $prefix = $dateFormat . '/DWPSBY/';

        $last = SaleTransaction::withTrashed()
            ->whereDate('transaction_date', $date->toDateString())
            ->where('invoice_number', 'like', $prefix . '%')
            ->orderByDesc('id')
            ->value('invoice_number');

        $nextNumber = 1;

        if ($last) {
            $lastSequence = (int) substr($last, -4); 
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
            $wasPartialPayment = $sale->total_amount > 0;
            $description = $wasPartialPayment
            ? 'PELUNASAN PENJUALAN ' . $sale->invoice_number
            : 'PENJUALAN ' . $sale->invoice_number;
            $total_amount = $sale->total_amount + $input['paid_amount'];
            $methodId = $input['purchase_method_id'];
            $isCancelMethod = $methodId > 2;
            $isPaid = $total_amount >= $sale->grand_total;
            $paymentType = $sale->payment_type;

            if ($sale->payment_type === 'cash' && !$isPaid) {
                $paymentType = 'credit';
            }
            $sale->update([
                'payment_method_id' => $input['payment_method_id'] ?? null,
                'total_amount'      => $total_amount,
                'change'            => $input['change_amount'],
                'purchasing_method_id' => $methodId,
                'payment_type'        => $isCancelMethod ? null : $paymentType,
                'payment_status'    => $isCancelMethod
                    ? 'canceled'
                    : ($isPaid ? 'paid' : $sale->payment_status),
                'updated_by'        => auth()->id(),
            ]);
            if ($isCancelMethod) {
                $sale->update([
                    'deleted_at' => now(),
                    'deleted_by' => auth()->id(),
                ]);
            }
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

            if (!$isCancelMethod) {
                $paymentMethod = PaymentMethod::find($input['payment_method_id']);
                $cashFlowType = $paymentMethod && $paymentMethod->kind === 'Cash'
                    ? 'cash'
                    : 'bank';
                CashLedger::create([
                    'transaction_date' => $sale->transaction_date,
                    'type' => CashLedger::TYPE_IN,
                    'category' => CashLedger::CATEGORY_OPERATING,
                    'amount' => $input['paid_amount'] - $input['change_amount'],
                    'description' => $description,
                    'reference_table' => CashLedger::REF_SALE,
                    'cash_flow_type'  => $cashFlowType,
                    'reference_id' => $sale->id,
                    'created_by' => auth()->id(),
                    'updated_by' => auth()->id(),
                ]);
            }
            return $sale->fresh();
        });
    }
}