<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductStock extends Model
{
    protected $table = 'product_stocks';

    protected $primaryKey = 'id';

    public $incrementing = false;

    public $timestamps = false;

    protected $casts = [
        'purchase_price' => 'decimal:2',
        'selling_price'  => 'decimal:2',
        'total_in'       => 'integer',
        'total_out'      => 'integer',
        'stock'          => 'integer',
    ];

    protected $appends = [
        'minimum_stock',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class, 'id', 'id');
    }

    public function getMinimumStockAttribute()
    {
        return $this->product?->minimum_stock;
    }
}