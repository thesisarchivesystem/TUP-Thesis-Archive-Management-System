<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ResetPasswordNotification extends Notification
{
    use Queueable;

    public function __construct(
        private readonly string $token,
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $frontendUrl = rtrim((string) config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:3000')), '/');
        $resetUrl = $frontendUrl.'/reset-password?token='.urlencode($this->token).'&email='.urlencode($notifiable->email);

        return (new MailMessage)
            ->subject('Reset Your Thesis Archive Password')
            ->greeting('Hello '.$notifiable->name.',')
            ->line('We received a request to reset the password for your Thesis Archive account.')
            ->action('Reset Password', $resetUrl)
            ->line('This password reset link will expire in 60 minutes.')
            ->line('If you did not request a password reset, no further action is needed.');
    }
}
