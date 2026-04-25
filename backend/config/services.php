<?php

return [
    'ably' => [
        'key' => env('ABLY_KEY'),
    ],
    'resend' => [
        'key' => env('RESEND_KEY'),
    ],
    'openrouter' => [
        'key' => env('OPENROUTER_API_KEY'),
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
