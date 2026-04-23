<?php

return [
    'name' => env('APP_NAME', 'TUP Thesis Archive'),
    'env'  => env('APP_ENV', 'production'),
    'debug' => env('APP_DEBUG', false),
    'url'  => env('APP_URL', 'http://localhost'),
    'frontend_url' => env('FRONTEND_URL', 'http://localhost:3000'),
    'asset_url' => env('ASSET_URL'),
    'timezone' => 'UTC',
    'locale' => 'en',
    'fallback_locale' => 'en',
    'key' => env('APP_KEY'),
    'cipher' => 'AES-256-CBC',
];
