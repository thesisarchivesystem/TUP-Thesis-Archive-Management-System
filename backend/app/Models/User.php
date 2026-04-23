<?php

namespace App\Models;

use App\Notifications\ResetPasswordNotification;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, HasUuids, Notifiable;

    protected $fillable = [
        'first_name',
        'last_name',
        'name',
        'email',
        'password',
        'role',
        'avatar_url',
        'is_active',
        'email_verified_at',
    ];

    protected $hidden = [
        'password',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'is_active' => 'boolean',
    ];

    protected static function booted(): void
    {
        static::saving(function (User $user) {
            $first = trim((string) ($user->first_name ?? ''));
            $last = trim((string) ($user->last_name ?? ''));

            if ($first !== '' || $last !== '') {
                $user->name = trim($first . ' ' . $last);
            }
        });
    }

    public function faculty(): HasOne
    {
        return $this->hasOne(FacultyProfile::class, 'user_id');
    }

    public function student(): HasOne
    {
        return $this->hasOne(StudentProfile::class, 'user_id');
    }

    public function vpaaProfile(): HasOne
    {
        return $this->hasOne(VpaaProfile::class, 'user_id');
    }

    public function theses(): HasMany
    {
        return $this->hasMany(Thesis::class, 'submitted_by');
    }

    public function advisedTheses(): HasMany
    {
        return $this->hasMany(Thesis::class, 'adviser_id');
    }

    public function sentMessages(): HasMany
    {
        return $this->hasMany(Message::class, 'sender_id');
    }

    public function receivedMessages(): HasMany
    {
        return $this->hasMany(Message::class, 'receiver_id');
    }

    public function notifications(): HasMany
    {
        return $this->hasMany(Notification::class, 'user_id');
    }

    public function activityLogs(): HasMany
    {
        return $this->hasMany(ActivityLog::class, 'user_id');
    }

    public function supportTickets(): HasMany
    {
        return $this->hasMany(SupportTicket::class, 'user_id');
    }

    public function getRouteKeyName(): string
    {
        return 'id';
    }

    public function sendPasswordResetNotification($token): void
    {
        $this->notify(new ResetPasswordNotification($token));
    }
}
