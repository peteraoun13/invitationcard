<?php

require __DIR__ . '/response.php';
require __DIR__ . '/db.php';

function normalize_uploaded_files(array $field): array
{
    foreach (['name', 'tmp_name', 'error', 'size'] as $requiredKey) {
        if (!array_key_exists($requiredKey, $field)) {
            json_error('Invalid upload request.');
        }
    }

    if (!is_array($field['name'])) {
        return [$field];
    }

    $normalized = [];

    foreach ($field['name'] as $index => $name) {
        if (!isset(
            $field['tmp_name'][$index],
            $field['error'][$index],
            $field['size'][$index]
        )) {
            json_error('Invalid upload request.');
        }

        $normalized[] = [
            'name' => $name,
            'tmp_name' => $field['tmp_name'][$index],
            'error' => $field['error'][$index],
            'size' => $field['size'][$index],
        ];
    }

    return $normalized;
}

function find_upload_family(PDO $pdo, string $reference): ?array
{
    $statement = $pdo->prepare(
        'SELECT * FROM families
         WHERE invite_token = ? OR public_slug = ?
         LIMIT 1'
    );
    $statement->execute([$reference, $reference]);
    $family = $statement->fetch();
    return $family ?: null;
}

function upload_error_message(int $code): string
{
    if (in_array($code, [UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE], true)) {
        return 'One of the files is too large.';
    }

    return 'One of the files could not be uploaded.';
}

function validate_image_file(string $path): void
{
    $imageInfo = @getimagesize($path);

    if (!is_array($imageInfo)) {
        json_error('One of the image files is invalid.');
    }

    $width = (int) ($imageInfo[0] ?? 0);
    $height = (int) ($imageInfo[1] ?? 0);

    if ($width < 1 || $height < 1 || $width > 12000 || $height > 12000) {
        json_error('One of the images has unsupported dimensions.');
    }

    if (($width * $height) > 60000000) {
        json_error('One of the images is too large to process safely.');
    }
}

try {
    require_method('POST');

    if (endpoint_action('upload') !== 'upload') {
        json_error('Unknown upload action.', 404);
    }

    $config = app_config();
    $uploadConfig = $config['uploads'];
    $uploadDir = rtrim((string) $uploadConfig['dir'], '/\\');
    $token = invite_reference($_POST['guestToken'] ?? $_POST['token'] ?? null);
    rate_limit('guest_upload:' . hash('sha256', $token), 6, 300);

    $pdo = db();
    $family = find_upload_family($pdo, $token);

    if (!$family) {
        json_error('Invitation not found.', 404);
    }

    if ($uploadDir === '') {
        throw new RuntimeException('Upload directory is not configured.');
    }

    if (!is_dir($uploadDir) && !mkdir($uploadDir, 0755, true)) {
        throw new RuntimeException('Upload directory could not be created.');
    }

    if (!is_writable($uploadDir)) {
        throw new RuntimeException('Upload directory is not writable.');
    }

    if (!isset($_FILES['files']) || !is_array($_FILES['files'])) {
        json_error('Choose at least one file.');
    }

    $files = normalize_uploaded_files($_FILES['files']);
    $maxFiles = max(1, (int) $uploadConfig['max_files_per_request']);

    if (count($files) === 0 || count($files) > $maxFiles) {
        json_error('Upload between 1 and ' . $maxFiles . ' files at a time.');
    }

    $allowedTypes = $uploadConfig['allowed_types'];
    $maxSize = max(1, (int) $uploadConfig['max_size']);
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $validatedFiles = [];

    foreach ($files as $file) {
        $uploadError = (int) ($file['error'] ?? UPLOAD_ERR_NO_FILE);

        if ($uploadError !== UPLOAD_ERR_OK) {
            json_error(upload_error_message($uploadError));
        }

        $size = filter_var($file['size'] ?? null, FILTER_VALIDATE_INT, [
            'options' => ['min_range' => 1, 'max_range' => $maxSize],
        ]);

        if ($size === false) {
            json_error('One of the files is empty or too large.');
        }

        $temporaryPath = (string) ($file['tmp_name'] ?? '');

        if ($temporaryPath === '' || !is_uploaded_file($temporaryPath)) {
            json_error('Invalid uploaded file.');
        }

        $originalName = clean_string(basename((string) ($file['name'] ?? '')), 190);
        $extension = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));

        if ($originalName === '' || !array_key_exists($extension, $allowedTypes)) {
            json_error('This file type is not allowed.');
        }

        $mimeType = (string) $finfo->file($temporaryPath);

        if (!in_array($mimeType, $allowedTypes[$extension], true)) {
            json_error('The file content does not match its extension.');
        }

        if (str_starts_with($mimeType, 'image/')) {
            validate_image_file($temporaryPath);
        }

        $validatedFiles[] = [
            'originalName' => $originalName,
            'extension' => $extension,
            'mimeType' => $mimeType,
            'temporaryPath' => $temporaryPath,
            'size' => (int) $size,
        ];
    }

    $saved = [];
    $movedPaths = [];
    $pdo->beginTransaction();
    $statement = $pdo->prepare(
        'INSERT INTO uploads
            (family_id, guest_id, file_name, original_name, file_type, file_path, file_size, uploaded_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW())'
    );

    foreach ($validatedFiles as $file) {
        do {
            $fileName = bin2hex(random_bytes(20)) . '.' . $file['extension'];
            $targetPath = $uploadDir . DIRECTORY_SEPARATOR . $fileName;
        } while (file_exists($targetPath));

        if (!move_uploaded_file($file['temporaryPath'], $targetPath)) {
            throw new RuntimeException('Uploaded file could not be stored.');
        }

        @chmod($targetPath, 0644);
        $movedPaths[] = $targetPath;
        $publicPath = '/uploads/' . $fileName;
        $statement->execute([
            $family['id'],
            null,
            $fileName,
            $file['originalName'],
            $file['mimeType'],
            $publicPath,
            $file['size'],
        ]);

        $saved[] = [
            'id' => (string) $pdo->lastInsertId(),
            'fileName' => $fileName,
            'filePath' => $publicPath,
            'fileType' => $file['mimeType'],
            'fileSize' => $file['size'],
        ];
    }

    $pdo->commit();
    json_response(['uploads' => $saved], 201);
} catch (Throwable $error) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }

    foreach ($movedPaths ?? [] as $movedPath) {
        if (is_file($movedPath)) {
            @unlink($movedPath);
        }
    }

    error_log($error->getMessage());
    json_error('Could not upload media.', 500);
}
