<?php

return [
    'ably' => [
        'key' => env('ABLY_KEY'),
    ],
    'brevo' => [
        'api_key' => env('BREVO_API_KEY'),
        'base_url' => env('BREVO_API_BASE_URL', 'https://api.brevo.com/v3'),
    ],
    'resend' => [
        'key' => env('RESEND_KEY'),
    ],
    'openrouter' => [
        'key' => env('OPENROUTER_API_KEY'),
        'base_url' => env('OPENROUTER_BASE_URL', 'https://openrouter.ai/api/v1'),
        'model' => env('OPENROUTER_MODEL', 'openai/gpt-4o-mini'),
        'site_url' => env('OPENROUTER_SITE_URL', env('APP_URL')),
        'site_name' => env('OPENROUTER_SITE_NAME', env('APP_NAME', 'TUP Thesis Archive')),
    ],
    'supabase' => [
        'url' => env('SUPABASE_URL'),
        'anon_key' => env('SUPABASE_ANON_KEY'),
        'service_key' => env('SUPABASE_SERVICE_KEY'),
        'bucket' => env('SUPABASE_STORAGE_BUCKET'),
    ],
    'zenquotes' => [
        'base_url' => env('ZENQUOTES_BASE_URL', 'https://zenquotes.io/api'),
        'key' => env('ZENQUOTES_API_KEY'),
    ],
];
