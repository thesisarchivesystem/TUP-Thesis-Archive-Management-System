<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Model;

class RecentlyViewed extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'recently_viewed';

    protected $fillable = [
        'user_id',
        'thesis_id',
        'viewed_at',
    ];

    protected $casts = [
        'viewed_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function thesis(): BelongsTo
    {
        return $this->belongsTo(Thesis::class, 'thesis_id');
    }
}
