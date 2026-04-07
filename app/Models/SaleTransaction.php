<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class SaleTransaction extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'invoice_number',
        'payment_method_id',
        'payment_status',
        'total_amount',
        'grand_total',
        'transaction_date',
        'created_by',
        'updated_by',
        'deleted_by',
    ];

    protected $casts = [
        'transaction_date' => 'datetime',
    ];

    // Relasi
    public function details()
    {
        return $this->hasMany(SaleTransactionDetail::class);
    }

    public function paymentMethod()
    {
        return $this->belongsTo(PaymentMethod::class);
    }

    // User tracking
    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updatedBy()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function deletedBy()
    {
        return $this->belongsTo(User::class, 'deleted_by');
    }
}