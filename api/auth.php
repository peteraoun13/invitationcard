<?php

require __DIR__ . '/response.php';
require __DIR__ . '/db.php';

function admin_payload(array $admin): array
{
    return [
        'id' => (string) $admin['id'],
        'email' => $admin['email'],
        'role' => $admin['role'] ?? 'admin',
    ];
}

try {
    $action = endpoint_action('me');

    if ($action === 'me') {
        require_method('GET');
        json_response([
            'user' => current_admin(),
            'csrfToken' => csrf_token(),
        ]);
    }

    if ($action === 'login') {
        require_method('POST');
        $input = request_json();
        $email = strtolower(clean_string($input['email'] ?? '', 190));
        $password = (string) ($input['password'] ?? '');

        if (!$email || !$password || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            json_error('Email and password are required.');
        }

        if (strlen($password) > 4096) {
            json_error('The email or password is incorrect.', 401);
        }

        $emailLimitKey = 'admin_login_email:' . hash('sha256', $email);
        rate_limit('admin_login_ip', 30, 300);
        rate_limit($emailLimitKey, 8, 300);
        $statement = db()->prepare('SELECT * FROM dashboard_users WHERE email = ? LIMIT 1');
        $statement->execute([$email]);
        $admin = $statement->fetch();
        $dummyHash = '$2y$10$7qvKxvLYNqJQHm8K2fC90evJXJ2zE7YtZ4hfUxrm2vx9mQO1lGMBu';
        $passwordMatches = password_verify($password, $admin['password_hash'] ?? $dummyHash);

        if (!$admin || !$passwordMatches) {
            json_error('The email or password is incorrect.', 401);
        }

        if (($admin['role'] ?? '') !== 'admin') {
            json_error('This account is not authorized for the admin dashboard.', 403);
        }

        clear_rate_limit('admin_login_ip');
        clear_rate_limit($emailLimitKey);
        establish_admin_session(admin_payload($admin));
        json_response([
            'user' => $_SESSION['admin_user'],
            'csrfToken' => csrf_token(),
        ]);
    }

    if ($action === 'logout') {
        require_method('POST');
        require_csrf();
        clear_admin_session();
        json_response(['signedOut' => true]);
    }

    if ($action === 'change-password') {
        require_method('POST');
        $admin = require_admin();
        require_csrf();
        $input = request_json();
        $oldPassword = (string) ($input['oldPassword'] ?? '');
        $newPassword = (string) ($input['newPassword'] ?? '');

        if (strlen($oldPassword) > 4096 || strlen($newPassword) > 4096) {
            json_error('Password is too long.');
        }

        if (strlen($newPassword) < 12) {
            json_error('Use at least 12 characters for the new password.');
        }

        $statement = db()->prepare('SELECT * FROM dashboard_users WHERE id = ? LIMIT 1');
        $statement->execute([$admin['id']]);
        $record = $statement->fetch();

        if (!$record || !password_verify($oldPassword, $record['password_hash'])) {
            json_error('The current password is incorrect.', 401);
        }

        $hash = password_hash($newPassword, PASSWORD_DEFAULT);
        $update = db()->prepare('UPDATE dashboard_users SET password_hash = ? WHERE id = ?');
        $update->execute([$hash, $admin['id']]);
        establish_admin_session($admin);
        json_response([
            'changed' => true,
            'csrfToken' => csrf_token(),
        ]);
    }

    json_error('Unknown auth action.', 404);
} catch (Throwable $error) {
    error_log($error->getMessage());
    json_error('Could not process authentication request.', 500);
}
