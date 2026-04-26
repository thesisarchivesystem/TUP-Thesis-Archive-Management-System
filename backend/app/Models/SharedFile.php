<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SharedFile extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'uploaded_by',
        'category_id',
        'category_ids',
        'title',
        'resource_type',
        'abstract',
        'keywords',
        'authors',
        'program',
        'department',
        'college',
        'school_year',
        'share_scope',
        'target_college',
        'target_department',
        'file_url',
        'file_name',
        'file_size',
        'mime_type',
        'is_draft',
        'shared_at',
    ];

    protected $casts = [
        'category_ids' => 'array',
        'keywords' => 'array',
        'authors' => 'array',
        'is_draft' => 'boolean',
        'shared_at' => 'datetime',
    ];

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function recipients(): HasMany
    {
        return $this->hasMany(SharedFileRecipient::class);
    }
}
