<?php

return [
    'app' => [
        'environment' => 'production',
        'allowed_origins' => ['https://jh-2026.com'],
    ],
    'db' => [
        'host' => 'YOUR_OVH_DATABASE_HOST',
        'port' => 3306,
        'name' => 'YOUR_DATABASE_NAME',
        'user' => 'YOUR_DATABASE_USERNAME',
        'password' => 'YOUR_DATABASE_PASSWORD',
    ],
    'security' => [
        'secure_cookie' => true,
        'session_idle_timeout' => 1800,
        'session_absolute_timeout' => 28800,
    ],
];
