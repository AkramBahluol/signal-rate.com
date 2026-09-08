<?php

namespace Tests\Feature;

use App\Models\Country;
use App\Models\MccMnc;
use App\Models\MccMncChange;
use App\Models\MccMncConflict;
use App\Services\Import\CountryImporter;
use App\Services\Import\MccMncImporter;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

final class TelecomDataImportTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Country::create(['name' => 'Testland', 'iso2' => 'TT', 'iso3' => 'TTT', 'numeric_code' => '001', 'slug' => 'testland', 'active' => true]);
    }

    public function test_country_and_calling_code_import_is_idempotent(): void
    {
        $path = $this->jsonFile(['dataset' => $this->countrySource(), 'records' => [[
            'name' => 'Testland', 'iso2' => 'TT', 'iso3' => 'TTT', 'numeric_code' => '001', 'slug' => 'testland',
            'continent' => 'Test region', 'calling_codes' => [['code' => '099', 'verification_status' => 'verified']],
        ]]]);
        $importer = app(CountryImporter::class);
        $importer->import($path);
        $importer->import($path);
        $this->assertDatabaseCount('countries', 1);
        $this->assertDatabaseCount('calling_codes', 1);
        $this->assertDatabaseHas('calling_codes', ['code' => '099', 'verification_status' => 'verified']);
    }

    public function test_mnc_leading_zero_operator_alias_and_api_pagination_are_preserved(): void
    {
        $path = $this->mccFile('regulator-a', 'v1', [$this->record('01', 'Example Network', true)]);
        $summary = app(MccMncImporter::class)->import($path);
        $this->assertSame(1, $summary['added']);
        $this->assertDatabaseHas('mcc_mnc', ['mcc' => '999', 'mnc' => '01', 'mnc_length' => 2]);
        $this->assertDatabaseHas('operator_aliases', ['normalized_name' => 'example legal ltd']);
        $this->getJson('/api/v1/mcc/999/01')->assertOk()->assertJsonPath('data.mnc', '01');
        $this->getJson('/api/v1/mcc/999?per_page=1')->assertOk()->assertJsonPath('meta.per_page', 1);
        $this->getJson('/api/v1/carriers/TT')->assertOk()->assertJsonPath('data.0.slug', 'example-mobile');
        $this->getJson('/api/v1/telecom/search?q=Example%20Legal')->assertOk()->assertJsonPath('data.operators.0.slug', 'example-mobile');
    }

    public function test_identical_import_is_idempotent(): void
    {
        $path = $this->mccFile('regulator-a', 'v1', [$this->record('01', 'Example Network')]);
        $importer = app(MccMncImporter::class);
        $importer->import($path);
        $summary = $importer->import($path);
        $this->assertSame(1, $summary['unchanged']);
        $this->assertDatabaseCount('telecom_snapshots', 1);
        $this->assertDatabaseCount('mcc_mnc_changes', 1);
    }

    public function test_verified_cross_source_conflict_is_recorded_without_overwrite(): void
    {
        $importer = app(MccMncImporter::class);
        $importer->import($this->mccFile('regulator-a', 'v1', [$this->record('01', 'Original Network')]));
        $summary = $importer->import($this->mccFile('regulator-b', 'v1', [$this->record('01', 'Conflicting Network')]));
        $this->assertSame(1, $summary['conflicted']);
        $this->assertSame('Original Network', MccMnc::first()->assignment_name);
        $this->assertSame('conflicted', MccMnc::first()->verification_status);
        $this->assertDatabaseCount('mcc_mnc_conflicts', 1);
        $this->assertSame('Conflicting Network', MccMncConflict::first()->incoming_value['assignment_name']);
    }

    public function test_two_missing_source_snapshots_deactivate_without_deleting(): void
    {
        $importer = app(MccMncImporter::class);
        $importer->import($this->mccFile('regulator-a', 'v1', [$this->record('01', 'Example Network')]));
        $importer->import($this->mccFile('regulator-a', 'v2', []));
        $this->assertTrue(MccMnc::first()->active);
        $importer->import($this->mccFile('regulator-a', 'v3', []));
        $this->assertFalse(MccMnc::first()->active);
        $this->assertSame('stale', MccMnc::first()->verification_status);
        $this->assertDatabaseCount('mcc_mnc', 1);
        $this->assertTrue(MccMncChange::where('change_type', 'removed')->exists());
        $importer->import($this->mccFile('regulator-a', 'v4', [$this->record('01', 'Example Network')]));
        $this->assertTrue(MccMnc::first()->active);
        $this->assertTrue(MccMncChange::where('change_type', 'reintroduced')->exists());
    }

    public function test_name_and_status_changes_are_audited(): void
    {
        $importer = app(MccMncImporter::class);
        $importer->import($this->mccFile('regulator-a', 'v1', [$this->record('01', 'Old Assignment')]));
        $renamed = $this->record('01', 'New Assignment');
        $importer->import($this->mccFile('regulator-a', 'v2', [$renamed]));
        $inactive = $renamed;
        $inactive['status'] = 'inactive';
        $importer->import($this->mccFile('regulator-a', 'v3', [$inactive]));
        $this->assertTrue(MccMncChange::where('change_type', 'operator_name_changed')->exists());
        $this->assertTrue(MccMncChange::where('change_type', 'status_changed')->exists());
    }

    /** @return array<string,mixed> */
    private function countrySource(): array
    {
        return ['key' => 'test-countries', 'source_name' => 'Test authority', 'source_url' => 'https://example.test/countries', 'source_type' => 'regulator', 'retrieved_at' => '2026-01-01T00:00:00Z', 'last_verified_at' => '2026-01-01T00:00:00Z', 'verification_status' => 'verified'];
    }

    /** @return array<string,mixed> */
    private function record(string $mnc, string $name, bool $withOperator = false): array
    {
        $record = ['mcc' => '999', 'mnc' => $mnc, 'country_iso2' => 'TT', 'assignment_name' => $name, 'status' => 'active'];
        if ($withOperator) {
            $record['operator'] = ['slug' => 'example-mobile', 'name' => 'Example Mobile Ltd', 'brand' => 'Example', 'aliases' => ['Example Legal Ltd']];
        }

        return $record;
    }

    /** @param array<int,array<string,mixed>> $records */
    private function mccFile(string $key, string $version, array $records): string
    {
        return $this->jsonFile(['source' => ['key' => $key, 'name' => $key, 'authority' => 'Test regulator', 'url' => "https://example.test/{$key}", 'source_type' => 'national-regulator', 'version' => $version, 'retrieved_at' => '2026-01-01T00:00:00Z'], 'records' => $records]);
    }

    /** @param array<string,mixed> $payload */
    private function jsonFile(array $payload): string
    {
        $path = tempnam(sys_get_temp_dir(), 'signalrate-telecom-');
        file_put_contents($path, json_encode($payload, JSON_THROW_ON_ERROR));

        return $path;
    }
}
