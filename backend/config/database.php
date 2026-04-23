<?php

use PDO;

return [
    'default' => env('DB_CONNECTION', 'pgsql'),

    'connections' => [
        'pgsql' => [
            'driver' => 'pgsql',
            'host' => env('DB_HOST', '127.0.0.1'),
            'port' => env('DB_PORT', '5432'),
            'database' => env('DB_DATABASE', 'forge'),
            'username' => env('DB_USERNAME', 'forge'),
            'password' => env('DB_PASSWORD', ''),
            'charset' => 'utf8',
            'prefix' => '',
            'prefix_indexes' => true,
            'search_path' => 'public',
            'sslmode' => env('DB_SSLMODE', 'prefer'),
            'options' => extension_loaded('pdo_pgsql') ? array_filter([
                // Helps when using transaction poolers (for example Supabase pooler:6543)
                // where server-side prepared statements may fail across pooled connections.
                PDO::ATTR_EMULATE_PREPARES => env('DB_EMULATE_PREPARES', false),
            ]) : [],
        ],
    ],

    'migrations' => 'migrations',
];
