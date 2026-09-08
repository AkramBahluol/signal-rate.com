<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

final class ExchangeRateApiTest extends TestCase
{
    public function test_ecb_rates_are_parsed_converted_and_cached(): void
    {
        Cache::forget('ecb.reference-rates.v1');
        Http::fake(['ecb.europa.eu/*' => Http::response('<?xml version="1.0"?><Envelope><Cube><Cube time="2026-09-08"><Cube currency="USD" rate="1.2000"/><Cube currency="GBP" rate="0.8000"/></Cube></Cube></Envelope>')]);
        $this->postJson('/api/v1/exchange-rates/convert', ['amount' => 120, 'from' => 'USD', 'to' => 'EUR'])->assertOk()->assertJsonPath('data.result', 100)->assertJsonPath('data.source_name', 'European Central Bank');
        $this->postJson('/api/v1/exchange-rates/convert', ['amount' => 100, 'from' => 'EUR', 'to' => 'GBP'])->assertOk()->assertJsonPath('data.result', 80);
        Http::assertSentCount(1);
    }

    public function test_unknown_currency_never_uses_invented_rate(): void
    {
        Cache::forget('ecb.reference-rates.v1');
        Http::fake(['ecb.europa.eu/*' => Http::response('<Cube time="2026-09-08"><Cube currency="USD" rate="1.2"/></Cube>')]);
        $this->postJson('/api/v1/exchange-rates/convert', ['amount' => 1, 'from' => 'USD', 'to' => 'ZZZ'])->assertUnprocessable();
    }
}
