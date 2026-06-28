<?php

if (basename($_SERVER['SCRIPT_FILENAME'] ?? '') === basename(__FILE__)) {
    http_response_code(404);
    exit;
}

$localConfig = [];
$configuredPath = trim((string) (getenv('APP_CONFIG_FILE') ?: ''));
$outsideWebRootPath = dirname(__DIR__, 2) . '/private/jh-invitation.php';
$configCandidates = array_filter([
    $configuredPath,
    $outsideWebRootPath,
    __DIR__ . '/config.local.php',
]);
$localConfigPath = null;

foreach ($configCandidates as $candidate) {
    if (is_file($candidate)) {
        $localConfigPath = $candidate;
        break;
    }
}

if ($localConfigPath !== null) {
    $loadedConfig = require $localConfigPath;

    if (is_array($loadedConfig)) {
        $localConfig = $loadedConfig;
    }
}

$readConfig = static function (
    string $environmentName,
    string $section,
    string $key,
    $default = null
) use ($localConfig) {
    $environmentValue = getenv($environmentName);

    if ($environmentValue !== false && $environmentValue !== '') {
        return $environmentValue;
    }

    return $localConfig[$section][$key] ?? $default;
};

$allowedOriginsValue = $readConfig('ALLOWED_ORIGINS', 'app', 'allowed_origins', []);
$allowedOrigins = is_array($allowedOriginsValue)
    ? $allowedOriginsValue
    : explode(',', (string) $allowedOriginsValue);
$allowedOrigins = array_values(array_filter(array_map(
    static fn($origin) => rtrim(trim((string) $origin), '/'),
    $allowedOrigins
)));

$secureCookieValue = $readConfig('SESSION_SECURE_COOKIE', 'security', 'secure_cookie', null);
$secureCookie = $secureCookieValue === null
    ? null
    : filter_var($secureCookieValue, FILTER_VALIDATE_BOOLEAN);

return [
    'app' => [
        'environment' => (string) $readConfig('APP_ENV', 'app', 'environment', 'production'),
        'allowed_origins' => $allowedOrigins,
        'max_json_body_size' => (int) $readConfig(
            'MAX_JSON_BODY_SIZE',
            'app',
            'max_json_body_size',
            64 * 1024
        ),
    ],
    'db' => [
        'host' => (string) $readConfig('DB_HOST', 'db', 'host', ''),
        'port' => (int) $readConfig('DB_PORT', 'db', 'port', 3306),
        'name' => (string) $readConfig('DB_NAME', 'db', 'name', ''),
        'user' => (string) $readConfig('DB_USER', 'db', 'user', ''),
        'password' => (string) $readConfig('DB_PASSWORD', 'db', 'password', ''),
        'charset' => 'utf8mb4',
    ],
    'security' => [
        'session_name' => (string) $readConfig(
            'SESSION_COOKIE_NAME',
            'security',
            'session_name',
            'jh_admin_session'
        ),
        'secure_cookie' => $secureCookie,
        'session_save_path' => (string) $readConfig(
            'SESSION_SAVE_PATH',
            'security',
            'session_save_path',
            ''
        ),
        'session_idle_timeout' => (int) $readConfig(
            'SESSION_IDLE_TIMEOUT',
            'security',
            'session_idle_timeout',
            30 * 60
        ),
        'session_absolute_timeout' => (int) $readConfig(
            'SESSION_ABSOLUTE_TIMEOUT',
            'security',
            'session_absolute_timeout',
            8 * 60 * 60
        ),
        'rate_limit_dir' => (string) $readConfig(
            'RATE_LIMIT_DIR',
            'security',
            'rate_limit_dir',
            sys_get_temp_dir() . '/jh-invitation-rate-limits'
        ),
    ],
    'uploads' => [
        'dir' => (string) $readConfig(
            'UPLOAD_DIR',
            'uploads',
            'dir',
            dirname(__DIR__) . '/uploads'
        ),
        'max_size' => (int) $readConfig(
            'MAX_UPLOAD_SIZE',
            'uploads',
            'max_size',
            25 * 1024 * 1024
        ),
        'max_files_per_request' => (int) $readConfig(
            'MAX_UPLOAD_FILES',
            'uploads',
            'max_files_per_request',
            10
        ),
        'allowed_types' => [
            'jpg' => ['image/jpeg'],
            'jpeg' => ['image/jpeg'],
            'png' => ['image/png'],
            'webp' => ['image/webp'],
            'mp4' => ['video/mp4'],
            'mov' => ['video/quicktime'],
        ],
    ],
];
