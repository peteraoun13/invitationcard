<?php

if (basename($_SERVER['SCRIPT_FILENAME'] ?? '') === basename(__FILE__)) {
    http_response_code(404);
    exit;
}

function calculate_family_status(array $family, array $guests): string
{
    if (count($guests) === 0) {
        return 'pending';
    }

    $responded = array_values(array_filter(
        $guests,
        static fn($guest) => (bool) $guest['responded']
    ));

    if (count($responded) === count($guests)) {
        $attending = count(array_filter(
            $responded,
            static fn($guest) => (bool) $guest['attending']
        ));

        if ($attending === count($guests)) {
            return 'completed';
        }

        if ($attending === 0) {
            return 'declined';
        }

        return 'partial';
    }

    if (count($responded) > 0) {
        return 'partial';
    }

    return !empty($family['opened_at']) || ($family['status'] ?? '') === 'opened'
        ? 'opened'
        : 'not_opened';
}
