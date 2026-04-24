<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExtensionRequest extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'thesis_id',
        'student_id',
        'faculty_id',
        'requested_deadline',
        'reason',
        'status',
    ];

    protected $casts = [
        'requested_deadline' => 'date',
    ];

    public function thesis(): BelongsTo
    {
        return $this->belongsTo(Thesis::class, 'thesis_id');
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function faculty(): BelongsTo
    {
        return $this->belongsTo(User::class, 'faculty_id');
    }
}
