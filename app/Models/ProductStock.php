<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductStock extends Model
{
    protected $table = 'product_stocks';

    // karena ini VIEW → biasanya tidak ada primary key increment
    protected $primaryKey = 'id';

    public $incrementing = false;

    // VIEW tidak punya timestamps
    public $timestamps = false;

    protected $fillable = [
        'id',
        'name',
        'brand',
        'purchase_price',
        'selling_price',
        'total_purchase',
        'total_sale',
        'stock',
    ];

    protected $casts = [
        'purchase_price' => 'decimal:2',
        'selling_price' => 'decimal:2',
        'total_purchase' => 'integer',
        'total_sale' => 'integer',
        'stock' => 'integer',
    ];
}