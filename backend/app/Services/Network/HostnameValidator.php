<?php

namespace App\Services\Network;

use InvalidArgumentException;

final class HostnameValidator
{
    public function normalize(string $hostname): string
    {
        $hostname = strtolower(rtrim(trim($hostname), '.'));
        if ($hostname === '' || strlen($hostname) > 253 || str_contains($hostname, '://') || filter_var($hostname, FILTER_VALIDATE_DOMAIN, FILTER_FLAG_HOSTNAME) === false) {
            throw new InvalidArgumentException('Enter a valid hostname without a URL scheme or path.');
        }
        if (! str_contains($hostname, '.') || preg_match('/(?:^|\.)(?:localhost|local|internal|home|lan)$/i', $hostname)) {
            throw new InvalidArgumentException('Only public fully qualified hostnames are supported.');
        }

        return $hostname;
    }
}
