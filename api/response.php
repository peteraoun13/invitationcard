<?php

if (basename($_SERVER['SCRIPT_FILENAME'] ?? '') === basename(__FILE__)) {
    http_response_code(404);
    exit;
}

function app_config(): array
{
    static $config = null;

    if (!is_array($config)) {
        $config = require __DIR__ . '/config.php';
    }

    return $config;
}

function apply_security_headers(): void
{
    header('Content-Type: application/json; charset=utf-8');
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: DENY');
    header('Referrer-Policy: no-referrer');
    header("Content-Security-Policy: default-src 'none'; frame-ancestors 'none'; base-uri 'none'");
    header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
    header('Pragma: no-cache');
}

function json_response(array $data = [], int $status = 200): void
{
    http_response_code($status);
    apply_security_headers();
    echo json_encode(
        ['ok' => $status < 400, 'data' => $data],
        JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE
    );
    exit;
}

function json_error(string $message, int $status = 400): void
{
    http_response_code($status);
    apply_security_headers();
    echo json_encode(
        ['ok' => false, 'error' => $message],
        JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE
    );
    exit;
}

function request_is_https(): bool
{
    return (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || strtolower((string) ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '')) === 'https';
}

function current_site_origin(): string
{
    $scheme = request_is_https() ? 'https' : 'http';
    $host = strtolower(trim((string) ($_SERVER['HTTP_HOST'] ?? '')));
    return $host === '' ? '' : $scheme . '://' . $host;
}

function normalize_origin(string $origin): string
{
    $parts = parse_url(trim($origin));

    if (!is_array($parts) || !isset($parts['scheme'], $parts['host'])) {
        return '';
    }

    $scheme = strtolower((string) $parts['scheme']);

    if (!in_array($scheme, ['http', 'https'], true)) {
        return '';
    }

    $normalized = $scheme . '://' . strtolower((string) $parts['host']);

    if (isset($parts['port'])) {
        $normalized .= ':' . (int) $parts['port'];
    }

    return rtrim($normalized, '/');
}

function initialize_request_security(): void
{
    apply_security_headers();
    $method = strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET'));

    if (!in_array($method, ['GET', 'POST', 'OPTIONS'], true)) {
        json_error('Method not allowed.', 405);
    }

    $originHeader = trim((string) ($_SERVER['HTTP_ORIGIN'] ?? ''));
    $normalizedOrigin = $originHeader === '' ? '' : normalize_origin($originHeader);
    $sameOrigin = normalize_origin(current_site_origin());
    $allowedOrigins = app_config()['app']['allowed_origins'] ?? [];
    $normalizedAllowedOrigins = array_map('normalize_origin', $allowedOrigins);

    if ($originHeader !== '') {
        $originAllowed = $normalizedOrigin !== ''
            && ($normalizedOrigin === $sameOrigin
                || in_array($normalizedOrigin, $normalizedAllowedOrigins, true));

        if (!$originAllowed) {
            json_error('Request origin is not allowed.', 403);
        }

        header('Access-Control-Allow-Origin: ' . $normalizedOrigin);
        header('Access-Control-Allow-Credentials: true');
        header('Vary: Origin');
    }

    if ($method === 'OPTIONS') {
        $requestedMethod = strtoupper((string) ($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_METHOD'] ?? ''));

        if (!in_array($requestedMethod, ['GET', 'POST'], true)) {
            json_error('Requested method is not allowed.', 405);
        }

        header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, X-CSRF-Token, X-Requested-With');
        header('Access-Control-Max-Age: 600');
        http_response_code(204);
        exit;
    }
}

function initialize_secure_session(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }

    $security = app_config()['security'];
    $sessionName = preg_replace('/[^A-Za-z0-9_-]/', '', (string) $security['session_name']);
    $secureCookie = $security['secure_cookie'];

    ini_set('session.use_strict_mode', '1');
    ini_set('session.use_only_cookies', '1');

    if (!empty($security['session_save_path'])) {
        session_save_path((string) $security['session_save_path']);
    }

    session_name($sessionName ?: 'jh_admin_session');
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'secure' => $secureCookie === null ? request_is_https() : (bool) $secureCookie,
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    if (!@session_start()) {
        error_log('The PHP session could not be started.');
        json_error('Could not start a secure session.', 500);
    }

    $now = time();

    if (isset($_SESSION['admin_user']) && !isset($_SESSION['admin_created_at'])) {
        $_SESSION['admin_created_at'] = $now;
        $_SESSION['admin_last_activity'] = $now;
    }

    $createdAt = (int) ($_SESSION['admin_created_at'] ?? $now);
    $lastActivity = (int) ($_SESSION['admin_last_activity'] ?? $now);
    $idleExpired = ($now - $lastActivity) > max(60, (int) $security['session_idle_timeout']);
    $absoluteExpired = ($now - $createdAt) > max(300, (int) $security['session_absolute_timeout']);

    if (isset($_SESSION['admin_user']) && ($idleExpired || $absoluteExpired)) {
        $_SESSION = [];
        session_regenerate_id(true);
    }

    if (isset($_SESSION['admin_user'])) {
        $_SESSION['admin_last_activity'] = $now;
    }

    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
}

function csrf_token(): string
{
    return (string) ($_SESSION['csrf_token'] ?? '');
}

function require_csrf(): void
{
    $provided = trim((string) ($_SERVER['HTTP_X_CSRF_TOKEN'] ?? ''));
    $expected = csrf_token();

    if ($provided === '' || $expected === '' || !hash_equals($expected, $provided)) {
        json_error('The security token is missing or expired. Refresh and try again.', 403);
    }
}

function establish_admin_session(array $admin): void
{
    session_regenerate_id(true);
    $_SESSION['admin_user'] = $admin;
    $_SESSION['admin_created_at'] = time();
    $_SESSION['admin_last_activity'] = time();
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}

function clear_admin_session(): void
{
    $_SESSION = [];

    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', [
            'expires' => time() - 42000,
            'path' => $params['path'],
            'domain' => $params['domain'],
            'secure' => $params['secure'],
            'httponly' => $params['httponly'],
            'samesite' => $params['samesite'] ?? 'Lax',
        ]);
    }

    session_destroy();
}

function require_method(string $method): void
{
    if (strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? '')) !== strtoupper($method)) {
        json_error('Method not allowed.', 405);
    }
}

function request_json(): array
{
    $contentType = strtolower(trim(explode(';', (string) ($_SERVER['CONTENT_TYPE'] ?? ''))[0]));

    if ($contentType !== 'application/json') {
        json_error('Content-Type must be application/json.', 415);
    }

    $maxSize = max(1024, (int) (app_config()['app']['max_json_body_size'] ?? 65536));
    $contentLength = (int) ($_SERVER['CONTENT_LENGTH'] ?? 0);

    if ($contentLength > $maxSize) {
        json_error('Request body is too large.', 413);
    }

    $raw = file_get_contents('php://input', false, null, 0, $maxSize + 1);

    if ($raw === false || strlen($raw) > $maxSize) {
        json_error('Request body is too large.', 413);
    }

    try {
        $data = json_decode($raw === '' ? '{}' : $raw, true, 32, JSON_THROW_ON_ERROR);
    } catch (JsonException $error) {
        json_error('Invalid JSON body.');
    }

    if (!is_array($data)) {
        json_error('JSON body must be an object.');
    }

    return $data;
}

function clean_string($value, int $maxLength = 255): string
{
    if (!is_scalar($value) && $value !== null) {
        return '';
    }

    $text = trim((string) $value);
    $text = preg_replace('/[\x00-\x1F\x7F]+/u', ' ', $text) ?: '';
    $text = preg_replace('/\s+/u', ' ', $text) ?: '';

    if (mb_strlen($text) > $maxLength) {
        $text = mb_substr($text, 0, $maxLength);
    }

    return $text;
}

function required_string($value, string $label, int $maxLength = 255): string
{
    if (!is_string($value)) {
        json_error($label . ' must be text.');
    }

    $value = trim($value);

    if ($value === '') {
        json_error($label . ' is required.');
    }

    if (mb_strlen($value) > $maxLength) {
        json_error($label . ' is too long.');
    }

    return clean_string($value, $maxLength);
}

function positive_integer($value, string $label): int
{
    $validated = filter_var($value, FILTER_VALIDATE_INT, [
        'options' => ['min_range' => 1],
    ]);

    if ($validated === false) {
        json_error($label . ' must be a valid positive number.');
    }

    return (int) $validated;
}

function string_list($value, string $label, int $maxItems = 240): array
{
    if (!is_array($value) || count($value) > $maxItems) {
        json_error($label . ' must be a list with at most ' . $maxItems . ' items.');
    }

    return $value;
}

function invite_reference($value): string
{
    $reference = required_string($value, 'Invitation token', 255);

    if (!preg_match('/^[A-Za-z0-9_-]{6,255}$/', $reference)) {
        json_error('Invitation token is invalid.');
    }

    return $reference;
}

function current_admin(): ?array
{
    $admin = $_SESSION['admin_user'] ?? null;
    return is_array($admin) ? $admin : null;
}

function require_admin(): array
{
    $admin = current_admin();

    if (!$admin) {
        json_error('You must be logged in.', 401);
    }

    if (($admin['role'] ?? '') !== 'admin') {
        json_error('You do not have permission to access this resource.', 403);
    }

    return $admin;
}

function client_ip_address(): string
{
    $address = (string) ($_SERVER['REMOTE_ADDR'] ?? 'unknown');
    return filter_var($address, FILTER_VALIDATE_IP) ? $address : 'unknown';
}

function session_rate_limit(string $bucketId, int $limit, int $windowSeconds): void
{
    $now = time();
    $_SESSION['rate_limits'] ??= [];
    $bucket = $_SESSION['rate_limits'][$bucketId] ?? ['count' => 0, 'start' => $now];

    if (($now - (int) $bucket['start']) >= $windowSeconds) {
        $bucket = ['count' => 0, 'start' => $now];
    }

    $bucket['count'] += 1;
    $_SESSION['rate_limits'][$bucketId] = $bucket;

    if ($bucket['count'] > $limit) {
        json_error('Too many requests. Please try again shortly.', 429);
    }
}

function rate_limit(string $key, int $limit, int $windowSeconds): void
{
    $limit = max(1, $limit);
    $windowSeconds = max(1, $windowSeconds);
    $bucketId = hash('sha256', client_ip_address() . '|' . $key);
    $directory = (string) (app_config()['security']['rate_limit_dir'] ?? '');

    if ($directory === '' || (!is_dir($directory) && !mkdir($directory, 0700, true))) {
        session_rate_limit($bucketId, $limit, $windowSeconds);
        return;
    }

    $path = rtrim($directory, '/\\') . DIRECTORY_SEPARATOR . $bucketId . '.json';
    $handle = @fopen($path, 'c+');

    if ($handle === false || !flock($handle, LOCK_EX)) {
        if (is_resource($handle)) {
            fclose($handle);
        }

        session_rate_limit($bucketId, $limit, $windowSeconds);
        return;
    }

    $contents = stream_get_contents($handle);
    $bucket = json_decode($contents ?: '{}', true);
    $now = time();

    if (!is_array($bucket) || ($now - (int) ($bucket['start'] ?? 0)) >= $windowSeconds) {
        $bucket = ['count' => 0, 'start' => $now];
    }

    $bucket['count'] = (int) $bucket['count'] + 1;
    rewind($handle);
    ftruncate($handle, 0);
    fwrite($handle, json_encode($bucket));
    fflush($handle);
    flock($handle, LOCK_UN);
    fclose($handle);

    if ($bucket['count'] > $limit) {
        json_error('Too many requests. Please try again shortly.', 429);
    }
}

function clear_rate_limit(string $key): void
{
    $bucketId = hash('sha256', client_ip_address() . '|' . $key);
    unset($_SESSION['rate_limits'][$bucketId]);
    $directory = (string) (app_config()['security']['rate_limit_dir'] ?? '');

    if ($directory !== '') {
        $path = rtrim($directory, '/\\') . DIRECTORY_SEPARATOR . $bucketId . '.json';

        if (is_file($path)) {
            @unlink($path);
        }
    }
}

function endpoint_action(string $default = ''): string
{
    $action = clean_string($_GET['action'] ?? $default, 64);

    if ($action !== '' && !preg_match('/^[a-z][a-z0-9-]*$/', $action)) {
        json_error('Invalid action.');
    }

    return $action;
}

initialize_request_security();
initialize_secure_session();
