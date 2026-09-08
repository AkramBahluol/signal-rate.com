<?php

namespace Tests\Unit;

use App\Services\Sms\SmsAnalyzer;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

final class SmsAnalyzerTest extends TestCase
{
    public function test_it_calculates_gsm7_and_extensions(): void
    {
        $r = (new SmsAnalyzer)->analyze('Hello €');
        $this->assertSame('GSM-7', $r['encoding']);
        $this->assertSame(8, $r['septets']);
    }

    public function test_it_detects_unicode_and_emoji(): void
    {
        $r = (new SmsAnalyzer)->analyze('مرحبا 😀');
        $this->assertSame('Unicode (UCS-2)', $r['encoding']);
        $this->assertSame(1, $r['segments']);
    }

    public function test_it_applies_multipart_limits(): void
    {
        $r = (new SmsAnalyzer)->analyze(str_repeat('a', 161));
        $this->assertSame(2, $r['segments']);
        $this->assertSame(153, $r['per_segment']);
    }

    #[DataProvider('boundaryMessages')]
    public function test_sms_boundaries(string $message, string $encoding, int $segments): void
    {
        $result = (new SmsAnalyzer)->analyze($message);
        $this->assertSame($encoding, $result['encoding']);
        $this->assertSame($segments, $result['segments']);
    }

    public static function boundaryMessages(): array
    {
        return [
            'empty' => ['', 'GSM-7', 0],
            '160 GSM' => [str_repeat('a', 160), 'GSM-7', 1],
            '161 GSM' => [str_repeat('a', 161), 'GSM-7', 2],
            '70 Unicode' => [str_repeat('ا', 70), 'Unicode (UCS-2)', 1],
            '71 Unicode' => [str_repeat('ا', 71), 'Unicode (UCS-2)', 2],
            'extension boundary' => [str_repeat('^', 80), 'GSM-7', 1],
            'Arabic' => ['مرحبا', 'Unicode (UCS-2)', 1],
            'emoji' => ['😀', 'Unicode (UCS-2)', 1],
            'long multipart' => [str_repeat('a', 1000), 'GSM-7', 7],
        ];
    }
}
