<?php

require __DIR__ . '/response.php';
require __DIR__ . '/db.php';
require __DIR__ . '/family-status.php';

function slugify_family(string $value): string
{
    $slug = strtolower(trim($value));
    $slug = preg_replace('/[^a-z0-9]+/i', '-', $slug) ?: 'family';
    $slug = trim($slug, '-');
    return $slug ?: 'family';
}

function random_token(): string
{
    return rtrim(strtr(base64_encode(random_bytes(16)), '+/', '-_'), '=');
}

function create_unique_token(PDO $pdo): string
{
    for ($attempt = 0; $attempt < 10; $attempt += 1) {
        $token = random_token();
        $statement = $pdo->prepare('SELECT id FROM families WHERE invite_token = ? LIMIT 1');
        $statement->execute([$token]);

        if (!$statement->fetch()) {
            return $token;
        }
    }

    json_error('Could not generate a unique invite token.', 500);
}

function family_public_slug(string $familyName, string $token): string
{
    return slugify_family($familyName) . '-' . $token;
}

function fetch_family(PDO $pdo, $familyId): ?array
{
    $statement = $pdo->prepare('SELECT * FROM families WHERE id = ? LIMIT 1');
    $statement->execute([$familyId]);
    $family = $statement->fetch();
    return $family ?: null;
}

function fetch_guests(PDO $pdo, $familyId): array
{
    $statement = $pdo->prepare('SELECT * FROM guests WHERE family_id = ? ORDER BY created_at ASC, id ASC');
    $statement->execute([$familyId]);
    return $statement->fetchAll();
}

function fetch_guest(PDO $pdo, int $familyId, int $guestId): ?array
{
    $statement = $pdo->prepare(
        'SELECT * FROM guests WHERE id = ? AND family_id = ? LIMIT 1'
    );
    $statement->execute([$guestId, $familyId]);
    $guest = $statement->fetch();
    return $guest ?: null;
}

function api_family(array $family): array
{
    return [
        'id' => (string) $family['id'],
        'familyName' => $family['family_name'],
        'inviteToken' => $family['invite_token'],
        'publicSlug' => $family['public_slug'],
        'status' => $family['status'],
        'openedAt' => $family['opened_at'],
        'createdAt' => $family['created_at'],
        'updatedAt' => $family['updated_at'],
    ];
}

function api_guest(array $guest): array
{
    return [
        'id' => (string) $guest['id'],
        'familyId' => (string) $guest['family_id'],
        'name' => $guest['guest_name'],
        'guest_name' => $guest['guest_name'],
        'attending' => $guest['responded'] ? (bool) $guest['attending'] : null,
        'responded' => (bool) $guest['responded'],
        'createdAt' => $guest['created_at'],
        'updatedAt' => $guest['updated_at'],
    ];
}

function update_family_status(PDO $pdo, $familyId): void
{
    $family = fetch_family($pdo, $familyId);

    if (!$family) {
        return;
    }

    $status = calculate_family_status($family, fetch_guests($pdo, $familyId));
    $statement = $pdo->prepare('UPDATE families SET status = ?, updated_at = NOW() WHERE id = ?');
    $statement->execute([$status, $familyId]);
}

try {
    require_admin();

    if (strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? '')) === 'POST') {
        require_csrf();
    }

    if (session_status() === PHP_SESSION_ACTIVE) {
        session_write_close();
    }

    $pdo = db();
    $action = endpoint_action('summaries');

    if ($action === 'summaries') {
        require_method('GET');
        $families = $pdo
            ->query(
                'SELECT id, family_name, invite_token, public_slug, status,
                        opened_at, created_at, updated_at
                 FROM families
                 ORDER BY created_at DESC, id DESC'
            )
            ->fetchAll();
        $guestRows = $pdo
            ->query(
                'SELECT id, family_id, guest_name, attending, responded,
                        created_at, updated_at
                 FROM guests
                 ORDER BY created_at ASC, id ASC'
            )
            ->fetchAll();
        $guestsByFamily = [];

        foreach ($guestRows as $guest) {
            $guestsByFamily[$guest['family_id']][] = api_guest($guest);
        }

        $payload = array_map(function ($family) use ($guestsByFamily) {
            $apiFamily = api_family($family);
            $apiFamily['guests'] = $guestsByFamily[$family['id']] ?? [];
            return $apiFamily;
        }, $families);

        json_response(['families' => $payload]);
    }

    if ($action === 'family') {
        require_method('GET');
        $familyId = positive_integer($_GET['familyId'] ?? null, 'Family ID');
        $family = fetch_family($pdo, $familyId);

        if (!$family) {
            json_error('Family not found.', 404);
        }

        json_response(['family' => api_family($family)]);
    }

    if ($action === 'guests') {
        require_method('GET');
        $familyId = positive_integer($_GET['familyId'] ?? null, 'Family ID');

        if (!fetch_family($pdo, $familyId)) {
            json_error('Family not found.', 404);
        }

        $guests = array_map('api_guest', fetch_guests($pdo, $familyId));
        json_response(['guests' => $guests]);
    }

    if ($action === 'create-family') {
        require_method('POST');
        $input = request_json();
        $familyName = required_string($input['familyName'] ?? null, 'Family name', 190);
        $guestValues = string_list($input['guests'] ?? [], 'Guests');
        $guests = [];

        foreach ($guestValues as $guestValue) {
            if (!is_string($guestValue)) {
                json_error('Every guest name must be text.');
            }

            if (trim($guestValue) !== '') {
                $guests[] = required_string($guestValue, 'Guest name', 190);
            }
        }

        $token = create_unique_token($pdo);
        $publicSlug = family_public_slug($familyName, $token);
        $status = count($guests) > 0 ? 'not_opened' : 'pending';
        $pdo->beginTransaction();

        $insertFamily = $pdo->prepare(
            'INSERT INTO families (family_name, invite_token, public_slug, status, created_at, updated_at)
             VALUES (?, ?, ?, ?, NOW(), NOW())'
        );
        $insertFamily->execute([$familyName, $token, $publicSlug, $status]);
        $familyId = $pdo->lastInsertId();

        $insertGuest = $pdo->prepare(
            'INSERT INTO guests (family_id, family_name, guest_name, guest_count, token, created_at, updated_at)
             VALUES (?, ?, ?, 1, ?, NOW(), NOW())'
        );

        foreach ($guests as $guestName) {
            $insertGuest->execute([$familyId, $familyName, $guestName, $token]);
        }

        $pdo->commit();
        json_response(['familyId' => (string) $familyId, 'inviteToken' => $token]);
    }

    if ($action === 'update-family') {
        require_method('POST');
        $input = request_json();
        $familyId = positive_integer($input['familyId'] ?? null, 'Family ID');
        $familyName = required_string($input['familyName'] ?? null, 'Family name', 190);
        $family = fetch_family($pdo, $familyId);

        if (!$family) {
            json_error('Family not found.', 404);
        }

        $publicSlug = family_public_slug($familyName, $family['invite_token']);
        $statement = $pdo->prepare(
            'UPDATE families SET family_name = ?, public_slug = ?, updated_at = NOW() WHERE id = ?'
        );
        $statement->execute([$familyName, $publicSlug, $familyId]);
        $pdo->prepare('UPDATE guests SET family_name = ? WHERE family_id = ?')
            ->execute([$familyName, $familyId]);
        json_response(['updated' => true]);
    }

    if ($action === 'delete-family') {
        require_method('POST');
        $input = request_json();
        $familyId = positive_integer($input['familyId'] ?? null, 'Family ID');

        if (!fetch_family($pdo, $familyId)) {
            json_error('Family not found.', 404);
        }

        $pdo->prepare('DELETE FROM families WHERE id = ?')->execute([$familyId]);
        json_response(['deleted' => true]);
    }

    if ($action === 'add-guest') {
        require_method('POST');
        $input = request_json();
        $familyId = positive_integer($input['familyId'] ?? null, 'Family ID');
        $guestName = required_string($input['guestName'] ?? null, 'Guest name', 190);
        $family = fetch_family($pdo, $familyId);

        if (!$family) {
            json_error('Family not found.', 404);
        }

        $countStatement = $pdo->prepare('SELECT COUNT(*) FROM guests WHERE family_id = ?');
        $countStatement->execute([$familyId]);

        if ((int) $countStatement->fetchColumn() >= 240) {
            json_error('This family has reached the maximum number of guests.', 409);
        }

        $statement = $pdo->prepare(
            'INSERT INTO guests (family_id, family_name, guest_name, guest_count, token, created_at, updated_at)
             VALUES (?, ?, ?, 1, ?, NOW(), NOW())'
        );
        $statement->execute([$familyId, $family['family_name'], $guestName, $family['invite_token']]);
        update_family_status($pdo, $familyId);
        json_response(['created' => true]);
    }

    if ($action === 'update-guest') {
        require_method('POST');
        $input = request_json();
        $familyId = positive_integer($input['familyId'] ?? null, 'Family ID');
        $guestId = positive_integer($input['guestId'] ?? null, 'Guest ID');
        $guestName = required_string($input['guestName'] ?? null, 'Guest name', 190);

        if (!fetch_guest($pdo, $familyId, $guestId)) {
            json_error('Guest not found.', 404);
        }

        $statement = $pdo->prepare(
            'UPDATE guests SET guest_name = ?, updated_at = NOW() WHERE id = ? AND family_id = ?'
        );
        $statement->execute([$guestName, $guestId, $familyId]);
        update_family_status($pdo, $familyId);
        json_response(['updated' => true]);
    }

    if ($action === 'update-guest-rsvp') {
        require_method('POST');
        $input = request_json();
        $familyId = positive_integer($input['familyId'] ?? null, 'Family ID');
        $guestId = positive_integer($input['guestId'] ?? null, 'Guest ID');
        $statusMap = [
            'pending' => [null, 0],
            'confirmed' => [1, 1],
            'declined' => [0, 1],
        ];
        $status = $input['status'] ?? '';

        if (!array_key_exists($status, $statusMap)) {
            json_error('Choose a valid RSVP status.');
        }

        if (!fetch_guest($pdo, $familyId, $guestId)) {
            json_error('Guest not found.', 404);
        }

        [$attending, $responded] = $statusMap[$status];
        $statement = $pdo->prepare(
            'UPDATE guests SET attending = ?, responded = ?, updated_at = NOW() WHERE id = ? AND family_id = ?'
        );
        $statement->execute([$attending, $responded, $guestId, $familyId]);
        update_family_status($pdo, $familyId);
        json_response(['updated' => true]);
    }

    if ($action === 'delete-guest') {
        require_method('POST');
        $input = request_json();
        $familyId = positive_integer($input['familyId'] ?? null, 'Family ID');
        $guestId = positive_integer($input['guestId'] ?? null, 'Guest ID');

        if (!fetch_guest($pdo, $familyId, $guestId)) {
            json_error('Guest not found.', 404);
        }

        $pdo->prepare('DELETE FROM guests WHERE id = ? AND family_id = ?')
            ->execute([$guestId, $familyId]);
        update_family_status($pdo, $familyId);
        json_response(['deleted' => true]);
    }

    json_error('Unknown guests action.', 404);
} catch (Throwable $error) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }

    error_log($error->getMessage());
    json_error('Could not process guest request.', 500);
}
