<?php

namespace App\Models;

use App\Notifications\ResetPasswordNotification;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
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

    public function sharedFiles(): HasMany
    {
        return $this->hasMany(SharedFile::class, 'uploaded_by');
    }

    public function sharedFileRecipients(): HasMany
    {
        return $this->hasMany(SharedFileRecipient::class, 'user_id');
    }

    public function extensionRequests(): HasMany
    {
        return $this->hasMany(ExtensionRequest::class, 'student_id');
    }

    public function receivedExtensionRequests(): HasMany
    {
        return $this->hasMany(ExtensionRequest::class, 'faculty_id');
    }

    public function getRouteKeyName(): string
    {
        return 'id';
    }

    public function sendPasswordResetNotification($token): void
    {
        $brevoApiKey = (string) config('services.brevo.api_key', '');

        if ($brevoApiKey !== '') {
            $frontendUrl = rtrim((string) config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:3000')), '/');
            $resetUrl = $frontendUrl.'/reset-password?token='.urlencode((string) $token).'&email='.urlencode((string) $this->email);

            $senderEmail = (string) config('mail.from.address', 'hello@example.com');
            $senderName = (string) config('mail.from.name', 'Example');
            $brevoBaseUrl = rtrim((string) config('services.brevo.base_url', 'https://api.brevo.com/v3'), '/');

            try {
                $response = Http::acceptJson()
                    ->timeout(15)
                    ->withHeaders([
                        'api-key' => $brevoApiKey,
                    ])
                    ->post($brevoBaseUrl.'/smtp/email', [
                        'sender' => [
                            'name' => $senderName,
                            'email' => $senderEmail,
                        ],
                        'to' => [[
                            'email' => (string) $this->email,
                            'name' => (string) $this->name,
                        ]],
                        'subject' => 'Reset Your Thesis Archive Password',
                        'htmlContent' => '<p>Hello '.e((string) $this->name).',</p>'
                            .'<p>We received a request to reset the password for your Thesis Archive account.</p>'
                            .'<p><a href="'.e($resetUrl).'">Reset Password</a></p>'
                            .'<p>This password reset link will expire in 60 minutes.</p>'
                            .'<p>If you did not request a password reset, no further action is needed.</p>',
                        'textContent' => "Hello {$this->name},\n\n"
                            ."We received a request to reset the password for your Thesis Archive account.\n"
                            ."Reset Password: {$resetUrl}\n\n"
                            .'This password reset link will expire in 60 minutes.\n'
                            .'If you did not request a password reset, no further action is needed.',
                    ]);

                if ($response->successful()) {
                    return;
                }

                Log::error('Brevo password reset send failed.', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                    'user_id' => $this->id,
                    'email' => $this->email,
                ]);
            } catch (\Throwable $e) {
                Log::error('Brevo password reset send exception.', [
                    'message' => $e->getMessage(),
                    'user_id' => $this->id,
                    'email' => $this->email,
                ]);
            }

            // Avoid falling back to SMTP in production, since SMTP connectivity is timing out.
            return;
        }

        if (app()->environment('production')) {
            Log::error('Password reset email skipped: BREVO_API_KEY is missing in production.', [
                'user_id' => $this->id,
                'email' => $this->email,
            ]);

            return;
        }

        $this->notify(new ResetPasswordNotification($token));
    }
}
