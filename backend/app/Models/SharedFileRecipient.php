<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SharedFileRecipient extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'shared_file_id',
        'user_id',
    ];

    public function sharedFile(): BelongsTo
    {
        return $this->belongsTo(SharedFile::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
