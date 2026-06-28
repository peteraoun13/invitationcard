<?php

require __DIR__ . '/response.php';
require __DIR__ . '/db.php';

try {
    require_admin();

    if (session_status() === PHP_SESSION_ACTIVE) {
        session_write_close();
    }

    $action = endpoint_action('uploads');

    if ($action === 'uploads') {
        require_method('GET');
        $statement = db()->query(
            'SELECT uploads.*, families.family_name
             FROM uploads
             LEFT JOIN families ON uploads.family_id = families.id
             ORDER BY uploads.uploaded_at DESC
             LIMIT 500'
        );
        json_response(['uploads' => $statement->fetchAll()]);
    }

    json_error('Unknown dashboard action.', 404);
} catch (Throwable $error) {
    error_log($error->getMessage());
    json_error('Could not load dashboard data.', 500);
}
