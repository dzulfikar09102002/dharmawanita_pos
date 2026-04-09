<?php

namespace App\Services;
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

            $totalAmount = collect($items)->sum(function ($item) {
                return $item['quantity'] * $item['selling_price'];
            });

            $sale = SaleTransaction::create([
                'invoice_number'   => $this->generateInvoiceNumber(),
                'payment_status'   => 'pending',
                'total_amount'     => $totalAmount,
                'grand_total'      => $totalAmount,
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

            return $sale->load('details.purchase.product');
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

        $sequence = str_pad($nextNumber, 3, '0', STR_PAD_LEFT);

        return $prefix . $sequence;
    }

}