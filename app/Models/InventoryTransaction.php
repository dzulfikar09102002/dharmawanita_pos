<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Enums\InventoryType;
use App\Enums\InventorySource;

class InventoryTransaction extends Model
{
    protected $fillable = [
        'product_id',
        'type',
        'source',
        'quantity',
        'purchase_price',
        'selling_price',
        'note',
        'created_by',
    ];

    protected $casts = [
        'type' => InventoryType::class,
        'source' => InventorySource::class,
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function isIn(): bool
    {
        return $this->type === InventoryType::IN;
    }

    public function isOut(): bool
    {
        return $this->type === InventoryType::OUT;
    }

    public function totalPurchase(): float
    {
        return ($this->purchase_price ?? 0) * $this->quantity;
    }

    public function totalSelling(): float
    {
        return ($this->selling_price ?? 0) * $this->quantity;
    }

    public function profit(): float
    {
        return $this->totalSelling() - $this->totalPurchase();
    }
}