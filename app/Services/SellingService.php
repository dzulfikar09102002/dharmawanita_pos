<?php

namespace App\Services;
use App\Models\PaymentMethod;
use App\Models\Purchase;
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

        $query = Purchase::with(['product.category', 'product.stock'])
            ->when($search, function ($query) use ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('code', 'like', "%$search%") 
                    ->orWhereHas('product', function ($q2) use ($search) {
                        $q2->where('name', 'like', "%$search%")
                            ->orWhereHas('category', function ($q3) use ($search) {
                                $q3->where('name', 'like', "%$search%");
                            });
                    });
                });
            });

        if ($category_id !== 'all') {
            $query->whereHas('product', function ($q) use ($category_id) {
                $q->where('category_id', $category_id);
            });
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
                    'source'         => $item['source'],
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

    
public function pay(SaleTransaction $sale, array $input): SaleTransaction
{
    return DB::transaction(function () use ($sale, $input) {

        $sale = SaleTransaction::whereKey($sale->id)
            ->where('payment_status', 'pending')
            ->lockForUpdate()
            ->firstOrFail();

        $sale->update([
            'payment_method_id' => $input['payment_method_id'],
            'total_amount'      => $input['paid_amount'],
            'change'            => $input['change_amount'],
            'payment_status'    => 'paid',
            'updated_by'        => auth()->id(),
        ]);

        return $sale->fresh();
    });
}
}