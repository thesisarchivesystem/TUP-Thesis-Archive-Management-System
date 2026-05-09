<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Model;

class StudentProfile extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'user_id',
        'student_id',
        'college_id',
        'department_id',
        'program_id',
        'course_id',
        'section_id',
        'department',
        'program',
        'course',
        'section',
        'year_level',
        'adviser_id',
        'created_by',
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

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function college(): BelongsTo
    {
        return $this->belongsTo(College::class, 'college_id');
    }

    public function departmentModel(): BelongsTo
    {
        return $this->belongsTo(Department::class, 'department_id');
    }

    public function programModel(): BelongsTo
    {
        return $this->belongsTo(Program::class, 'program_id');
    }

    public function courseModel(): BelongsTo
    {
        return $this->belongsTo(Program::class, 'course_id');
    }

    public function sectionModel(): BelongsTo
    {
        return $this->belongsTo(Section::class, 'section_id');
    }

    public function adviser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'adviser_id');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
