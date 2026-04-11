<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DailyQuote extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'body',
        'author',
        'quote_date',
        'is_active',
    ];

    protected $casts = [
        'quote_date' => 'date',
        'is_active' => 'boolean',
    ];
}
