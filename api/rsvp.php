<?php

require __DIR__ . '/response.php';
require __DIR__ . '/db.php';
require __DIR__ . '/family-status.php';

function api_family_public(array $family): array
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

function api_guest_public(array $guest): array
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

function find_family_by_invite(PDO $pdo, string $inviteSlug): ?array
{
    $statement = $pdo->prepare(
        'SELECT * FROM families WHERE invite_token = ? OR public_slug = ? LIMIT 1'
    );
    $statement->execute([$inviteSlug, $inviteSlug]);
    $family = $statement->fetch();
    return $family ?: null;
}

function public_guests(PDO $pdo, $familyId): array
{
    $statement = $pdo->prepare('SELECT * FROM guests WHERE family_id = ? ORDER BY created_at ASC, id ASC');
    $statement->execute([$familyId]);
    return $statement->fetchAll();
}

function update_public_family_status(PDO $pdo, array $family): void
{
    $status = calculate_family_status($family, public_guests($pdo, $family['id']));
    $statement = $pdo->prepare('UPDATE families SET status = ?, updated_at = NOW() WHERE id = ?');
    $statement->execute([$status, $family['id']]);
}

try {
    $pdo = db();
    $action = endpoint_action('');
    $method = strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? ''));

    if ($method === 'GET' && $action === '') {
        $token = invite_reference($_GET['token'] ?? null);

        rate_limit('invite_read:' . hash('sha256', $token), 120, 300);

        $family = find_family_by_invite($pdo, $token);

        if (!$family) {
            json_response(['family' => null, 'guests' => [], 'hasSubmittedRsvp' => false]);
        }

        $guests = public_guests($pdo, $family['id']);
        $currentStatus = calculate_family_status($family, $guests);

        if (count($guests) > 0 && !in_array($currentStatus, ['partial', 'completed', 'declined'], true)) {
            $statement = $pdo->prepare(
                'UPDATE families SET opened_at = COALESCE(opened_at, NOW()), status = ?, updated_at = NOW() WHERE id = ?'
            );
            $statement->execute(['opened', $family['id']]);
            $family['status'] = 'opened';
            $family['opened_at'] = $family['opened_at'] ?: date('Y-m-d H:i:s');
        }

        json_response([
            'family' => api_family_public($family),
            'guests' => array_map('api_guest_public', $guests),
            'hasSubmittedRsvp' => count(array_filter($guests, fn($guest) => (bool) $guest['responded'])) > 0,
        ]);
    }

    if ($action === 'submit') {
        require_method('POST');
        $input = request_json();
        $familyId = positive_integer($input['familyId'] ?? null, 'Family ID');
        $inviteToken = invite_reference($input['inviteToken'] ?? null);
        $selectedGuestIds = [];
        $explicitResponseIds = [];
        $responseValues = $input['responses'] ?? null;

        if (!is_array($responseValues) || count($responseValues) === 0) {
            json_error('Please answer Yes or No for every guest.');
        }

        if (count($responseValues) > 240) {
            json_error('Too many guest responses.');
        }

        foreach ($responseValues as $responseValue) {
            if (!is_array($responseValue) || !array_key_exists('attending', $responseValue)) {
                json_error('Every guest must have a Yes or No response.');
            }

            $responseGuestId = positive_integer(
                $responseValue['guestId'] ?? null,
                'Guest ID'
            );

            if (!is_bool($responseValue['attending'])) {
                json_error('Every guest must have a Yes or No response.');
            }

            if (isset($explicitResponseIds[(string) $responseGuestId])) {
                json_error('A guest response was submitted more than once.');
            }

            $explicitResponseIds[(string) $responseGuestId] = true;

            if ($responseValue['attending']) {
                $selectedGuestIds[] = $responseGuestId;
            }
        }

        $selectedGuestIds = array_values(array_unique($selectedGuestIds));
        $selected = array_fill_keys(array_map('strval', $selectedGuestIds), true);
        rate_limit('rsvp_submit:' . hash('sha256', $inviteToken), 10, 300);

        $familyStatement = $pdo->prepare('SELECT * FROM families WHERE id = ? AND invite_token = ? LIMIT 1');
        $familyStatement->execute([$familyId, $inviteToken]);
        $family = $familyStatement->fetch();

        if (!$family) {
            json_error('Invitation not found.', 404);
        }

        $guests = public_guests($pdo, $familyId);

        if (count($guests) === 0) {
            json_error('This invitation does not have any guests yet.', 409);
        }

        $familyGuestIds = array_map(static fn($guest) => (int) $guest['id'], $guests);

        if (array_diff($selectedGuestIds, $familyGuestIds)) {
            json_error('One or more selected guests do not belong to this invitation.');
        }

        $familyGuestIdKeys = array_fill_keys(array_map('strval', $familyGuestIds), true);

        if (
            count($explicitResponseIds) !== count($familyGuestIdKeys)
            || array_diff_key($explicitResponseIds, $familyGuestIdKeys)
            || array_diff_key($familyGuestIdKeys, $explicitResponseIds)
        ) {
            json_error('Please answer Yes or No for every guest.');
        }

        $responses = [];
        $pdo->beginTransaction();
        $submissionId = null;

        $insertRsvp = $pdo->prepare(
            'INSERT INTO rsvps (guest_id, attending, number_attending, message, created_at)
             VALUES (?, ?, ?, ?, NOW())'
        );
        $updateGuest = $pdo->prepare(
            'UPDATE guests SET attending = ?, responded = 1, updated_at = NOW() WHERE id = ? AND family_id = ?'
        );

        foreach ($guests as $guest) {
            $attending = isset($selected[(string) $guest['id']]) ? 1 : 0;
            $insertRsvp->execute([$guest['id'], $attending, $attending, null]);

            if ($submissionId === null) {
                $submissionId = (string) $pdo->lastInsertId();
            }

            $updateGuest->execute([$attending, $guest['id'], $familyId]);
            $responses[] = [
                'guestId' => (string) $guest['id'],
                'name' => $guest['guest_name'],
                'attending' => (bool) $attending,
            ];
        }

        update_public_family_status($pdo, $family);
        $pdo->commit();

        json_response([
            'submissionId' => $submissionId,
            'responses' => $responses,
        ]);
    }

    json_error('Unknown RSVP action.', 404);
} catch (Throwable $error) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }

    error_log($error->getMessage());
    json_error('Could not process RSVP request.', 500);
}
