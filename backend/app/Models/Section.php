<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Section extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'program_id',
        'course_id',
        'name',
        'code',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function getProgramIdAttribute(?string $value): ?string
    {
        return $value ?? $this->attributes['course_id'] ?? null;
    }

    public function setProgramIdAttribute(?string $value): void
    {
        $this->attributes['program_id'] = $value;
        $this->attributes['course_id'] = $value;
    }

    public function getCourseIdAttribute(?string $value): ?string
    {
        return $value ?? $this->attributes['program_id'] ?? null;
    }

    public function setCourseIdAttribute(?string $value): void
    {
        $this->attributes['course_id'] = $value;
        $this->attributes['program_id'] = $value;
    }

    public function program(): BelongsTo
    {
        return $this->belongsTo(Program::class);
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Program::class, 'course_id');
    }
}
