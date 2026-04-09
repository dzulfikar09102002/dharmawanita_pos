<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductStock extends Model
{
    protected $table = 'product_stocks';

    protected $primaryKey = 'id';

    public $incrementing = false;

    // VIEW tidak punya timestamps
    public $timestamps = false;

}