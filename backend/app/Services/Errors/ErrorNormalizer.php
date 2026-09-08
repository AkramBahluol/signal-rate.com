<?php

namespace App\Services\Errors;

use InvalidArgumentException;

final class ErrorNormalizer
{
    public function code(string $family, string $input): string
    {
        $value = trim($input);

        return match (strtolower($family)) {
            'http' => preg_match('/^[1-5]\d{2}$/', $value) ? $value : throw new InvalidArgumentException('HTTP codes must be three digits from 100 to 599.'),
            'postgresql' => preg_match('/^[0-9A-Za-z]{5}$/', $value) ? strtoupper($value) : throw new InvalidArgumentException('PostgreSQL SQLSTATE codes must contain exactly five letters or digits.'),
            'mysql' => preg_match('/^\d{1,10}$/', $value) && (int) $value > 0 && (int) $value <= 9999 ? (string) (int) $value : throw new InvalidArgumentException('MySQL codes must be a positive numeric error code up to four significant digits.'),
            'smpp' => $this->smpp($value),
            'php', 'laravel' => preg_match('/^[A-Za-z][A-Za-z0-9 _-]{1,100}$/', $value) ? strtolower(trim(preg_replace('/[^A-Za-z0-9]+/', '-', $value), '-')) : throw new InvalidArgumentException('Use a stable named error or slug.'),
            default => throw new InvalidArgumentException('Unknown error family.'),
        };
    }

    public function alias(string $value): string
    {
        return strtolower(trim(preg_replace('/\s+/', ' ', $value)));
    }

    private function smpp(string $value): string
    {
        if (preg_match('/^0x([0-9a-f]{1,8})$/i', $value, $match)) {
            return str_pad(strtoupper($match[1]), 8, '0', STR_PAD_LEFT);
        }
        if (preg_match('/^[0-9a-f]{8}$/i', $value)) {
            return strtoupper($value);
        }
        if (preg_match('/^\d{1,9}$/', $value) && (int) $value <= 0xFFFFFFFF) {
            return strtoupper(str_pad(dechex((int) $value), 8, '0', STR_PAD_LEFT));
        }
        throw new InvalidArgumentException('SMPP status must be hexadecimal (0x0000000D or 0000000D) or an unsigned decimal value.');
    }
}
