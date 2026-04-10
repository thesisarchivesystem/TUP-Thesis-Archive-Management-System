<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Model;

class FacultyProfile extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'user_id',
        'faculty_id',
        'department',
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

    public function assignedChair(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_chair_id');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
