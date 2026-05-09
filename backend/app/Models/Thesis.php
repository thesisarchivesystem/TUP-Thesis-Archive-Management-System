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
        'course',
        'category_id',
        'category_ids',
        'school_year',
        'authors',
        'file_url',
        'file_name',
        'file_size',
        'cover_file_url',
        'cover_file_name',
        'supplementary_files',
        'status',
        'is_archived',
        'submitted_by',
        'submitter_name',
        'adviser_id',
        'adviser_name',
        'rejection_reason',
        'adviser_remarks',
        'revision_due_at',
        'view_count',
        'submitted_at',
        'reviewed_at',
        'approved_at',
        'archived_at',
        'archived_by',
        'archived_by_name',
    ];

    protected $casts = [
        'keywords' => 'array',
        'authors' => 'array',
        'category_ids' => 'array',
        'supplementary_files' => 'array',
        'is_archived' => 'boolean',
        'submitted_at' => 'datetime',
        'reviewed_at' => 'datetime',
        'approved_at' => 'datetime',
        'archived_at' => 'datetime',
        'revision_due_at' => 'date',
    ];

    public function getProgramAttribute(?string $value): ?string
    {
        return $value ?? $this->attributes['course'] ?? null;
    }

    public function setProgramAttribute(?string $value): void
    {
        $this->attributes['program'] = $value;
        $this->attributes['course'] = $value;
    }

    public function getCourseAttribute(?string $value): ?string
    {
        return $value ?? $this->attributes['program'] ?? null;
    }

    public function setCourseAttribute(?string $value): void
    {
        $this->attributes['course'] = $value;
        $this->attributes['program'] = $value;
    }

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
