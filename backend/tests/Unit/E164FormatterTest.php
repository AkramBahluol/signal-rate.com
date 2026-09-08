<?php

namespace Tests\Unit;

use App\Services\Phone\E164Formatter;
use PHPUnit\Framework\TestCase;

final class E164FormatterTest extends TestCase
{
    public function test_formats_national_number_with_region(): void
    {
        $r = (new E164Formatter)->format('(202) 555-0123', 'US');
        $this->assertTrue($r['valid']);
        $this->assertSame('+12025550123', $r['e164']);
    }

    public function test_normalizes_international_prefix(): void
    {
        $r = (new E164Formatter)->format('0044 20 7946 0018');
        $this->assertTrue($r['valid']);
        $this->assertSame('+442079460018', $r['e164']);
    }

    public function test_supports_explicit_calling_code(): void
    {
        $r = (new E164Formatter)->format('20 7946 0018', null, '44');
        $this->assertTrue($r['valid']);
    }

    public function test_rejects_impossible_number(): void
    {
        $r = (new E164Formatter)->format('12', 'US');
        $this->assertFalse($r['valid']);
        $this->assertNotEmpty($r['error']);
    }
}
