<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

final class TelecomApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_sms_api_preserves_existing_contract(): void
    {
        $this->postJson('/api/v1/sms/calculate', ['message' => str_repeat('a', 161)])->assertOk()->assertJson(['encoding' => 'GSM-7', 'segments' => 2]);
    }

    public function test_e164_api_formats_valid_number(): void
    {
        $this->postJson('/api/v1/e164/format', ['phone' => '(202) 555-0123', 'country' => 'US'])->assertOk()->assertJson(['valid' => true, 'e164' => '+12025550123']);
    }

    public function test_country_and_calling_code_apis(): void
    {
        $this->seed();
        $this->getJson('/api/v1/countries?q=Germany')->assertOk()->assertJsonPath('data.0.iso2', 'DE')->assertJsonStructure(['meta' => ['current_page', 'last_page', 'per_page', 'total']]);
        $this->getJson('/api/v1/countries/us')->assertOk()->assertJsonPath('data.name', 'United States');
        $this->getJson('/api/v1/calling-codes/44')->assertOk()->assertJsonFragment(['iso2' => 'GB']);
    }

    public function test_empty_carrier_and_mcc_foundation_returns_clean_results(): void
    {
        $this->getJson('/api/v1/carriers')->assertOk()->assertJsonCount(0, 'data');
        $this->getJson('/api/v1/mcc/310')->assertOk()->assertJsonCount(0, 'data');
        $this->getJson('/api/v1/mcc?q=Germany')->assertOk()->assertJsonCount(0, 'data');
    }

    public function test_global_search_finds_tools(): void
    {
        $this->getJson('/api/v1/search?q=gsm')->assertOk()->assertJsonFragment(['title' => 'GSM-7 Checker']);
    }

    public function test_global_search_finds_developer_tools(): void
    {
        $queries = [
            'format json' => 'JSON Formatter', 'validate json' => 'JSON Validator', 'base64' => 'Base64 Encoder / Decoder',
            'jwt' => 'JWT Decoder', 'uuid' => 'UUID Generator', 'timestamp' => 'Unix Timestamp Converter',
            'url encode' => 'URL Encoder / Decoder', 'sha256' => 'Hash Generator', 'html encode' => 'HTML Encoder / Decoder',
            'diff' => 'Text Diff', 'slug' => 'Slug Generator',
        ];

        foreach ($queries as $query => $title) {
            $this->getJson('/api/v1/search?q='.urlencode($query))->assertOk()->assertJsonFragment(['title' => $title]);
        }

        $this->getJson('/api/v1/search?q=url%20encode')->assertJsonPath('data.0.title', 'URL Encoder / Decoder');
    }
}
