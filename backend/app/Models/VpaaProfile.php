<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VpaaProfile extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'user_id',
        'employee_id',
        'mobile',
        'office',
        'role_title',
        'supervised_units',
        'office_hours',
        'signature_title',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
