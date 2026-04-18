<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Model;

class Thesis extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'title',
        'abstract',
        'keywords',
        'department',
        'program',
        'category_id',
        'school_year',
        'authors',
        'file_url',
        'file_name',
        'file_size',
        'cover_file_url',
        'cover_file_name',
        'supplementary_files',
        'status',
        'submitted_by',
        'adviser_id',
        'rejection_reason',
        'adviser_remarks',
        'view_count',
        'submitted_at',
        'reviewed_at',
        'approved_at',
    ];

    protected $casts = [
        'keywords' => 'array',
        'authors' => 'array',
        'supplementary_files' => 'array',
        'submitted_at' => 'datetime',
        'reviewed_at' => 'datetime',
        'approved_at' => 'datetime',
    ];

    public function submitter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'submitted_by');
    }

    public function adviser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'adviser_id');
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function recentlyViewed(): HasMany
    {
        return $this->hasMany(RecentlyViewed::class, 'thesis_id');
    }
}
