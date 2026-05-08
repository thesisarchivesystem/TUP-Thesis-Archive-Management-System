<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FacultyProfile extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'user_id',
        'faculty_id',
        'department',
        'college',
        'college_id',
        'department_id',
        'rank',
        'faculty_role',
        'assigned_chair_id',
        'notes',
        'status',
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

    public function assignedChair(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_chair_id');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
