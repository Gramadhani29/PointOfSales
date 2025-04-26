<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Product extends Model
{
    use HasFactory;

    protected $table = 'product';

    protected $fillable = [
        'product_name',
        'product_category',
        'product_price',
        'product_image',
    ];
}
