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
        'section_id',
        'department',
        'program',
        'section',
        'year_level',
        'adviser_id',
        'created_by',
    ];

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
