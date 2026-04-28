<?php

return [
    'default' => env('CACHE_STORE', env('CACHE_DRIVER', 'database')),

    'stores' => [
        'array' => [
            'driver' => 'array',
            'serialize' => false,
        ],

        'database' => [
            'driver' => 'database',
            'connection' => env('DB_CACHE_CONNECTION'),
            'table' => env('DB_CACHE_TABLE', 'cache'),
            'lock_connection' => env('DB_CACHE_LOCK_CONNECTION'),
            'lock_table' => env('DB_CACHE_LOCK_TABLE'),
        ],

        'file' => [
            'driver' => 'file',
            'path' => storage_path('framework/cache/data'),
            'lock_path' => storage_path('framework/cache/data'),
        ],
    ],

    'prefix' => env(
        'CACHE_PREFIX',
        strtolower(preg_replace('/[^A-Za-z0-9]+/', '_', env('APP_NAME', 'laravel'))).'_cache_'
    ),

    'limiter' => env('CACHE_LIMITER', env('CACHE_STORE', env('CACHE_DRIVER', 'database'))),
];
