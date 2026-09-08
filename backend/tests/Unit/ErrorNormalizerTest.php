<?php

namespace Tests\Unit;

use App\Services\Errors\ErrorNormalizer;
use InvalidArgumentException;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

final class ErrorNormalizerTest extends TestCase
{
    #[DataProvider('validCodes')]
    public function test_it_normalizes_family_codes(string $family, string $input, string $expected): void
    {
        $this->assertSame($expected, (new ErrorNormalizer)->code($family, $input));
    }

    public static function validCodes(): array
    {
        return [
            ['http', '404', '404'], ['postgresql', '42p01', '42P01'], ['mysql', '01064', '1064'],
            ['smpp', '0x0000000d', '0000000D'], ['smpp', '0000000D', '0000000D'], ['smpp', '13', '0000000D'],
            ['php', 'TypeError', 'typeerror'], ['laravel', 'Route not defined', 'route-not-defined'],
        ];
    }

    public function test_it_rejects_invalid_family_codes(): void
    {
        $this->expectException(InvalidArgumentException::class);
        (new ErrorNormalizer)->code('postgresql', '42P0');
    }
}
