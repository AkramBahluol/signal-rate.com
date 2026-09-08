<?php

namespace App\Services\Network;

use InvalidArgumentException;

final class Asn
{
    public function normalize(string $asn): int
    {
        if (! preg_match('/^(?:AS)?(\d{1,10})$/i', trim($asn), $matches)) {
            throw new InvalidArgumentException('Enter an ASN such as AS15169 or 15169.');
        }
        $value = (int) $matches[1];
        if ($value < 1 || $value > 4294967295) {
            throw new InvalidArgumentException('ASN is outside the supported 32-bit range.');
        }

        return $value;
    }
}
