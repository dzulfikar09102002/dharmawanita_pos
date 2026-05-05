<?php

namespace App\Exports;

use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;

class StockReportExport implements FromCollection, WithHeadings
{
    protected $search;
    protected $byCategory;

    public function __construct($search = null, bool $byCategory = false)
    {
        $this->search = $search;
        $this->byCategory = $byCategory;
    }

    public function collection()
    {
        if ($this->byCategory) {

            $query = DB::table('product_stocks')
                ->select(
                    DB::raw('category_name as name'),
                    DB::raw('SUM(total_in) as total_in'),
                    DB::raw('SUM(total_out) as total_out'),
                    DB::raw('SUM(stock) as stock')
                )
                ->groupBy('category_id', 'category_name');

            if ($this->search) {
                $query->having('category_name', 'like', "%{$this->search}%");
            }

            return $query
                ->orderByDesc('stock')
                ->get();
        }

        $data = DB::table('product_stocks')
        ->select([
            'name',
            'brand',
            'total_in',
            'total_out',
            'stock',
            DB::raw('(purchase_price * stock) as asset'),
        ])
        ->orderBy('category_id')
        ->orderBy('name')
        ->get();
        $totalAsset = $data->sum('asset');

        $data->push((object)[
            'name' => 'TOTAL',
            'brand' => '',
            'total_in' => '',
            'total_out' => '',
            'stock' => '',
            'asset' => $totalAsset,
        ]);

        return $data;
    }

    public function headings(): array
    {
        if ($this->byCategory) {
            return [
                'Nama Kategori',
                'Stok Masuk',
                'Stok Keluar',
                'Jumlah Stok',
            ];
        }

        return [
            'Nama Produk',
            'Brand',
            'Stok Masuk',
            'Stok Keluar',
            'Jumlah Stok',
            'Nilai Asset',
        ];
    }
}