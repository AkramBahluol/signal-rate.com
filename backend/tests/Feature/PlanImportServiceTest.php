<?php

namespace Tests\Feature;

use App\Models\Country;
use App\Models\MobilePlan;
use App\Models\Operator;
use App\Models\PlanSource;
use App\Services\Plans\Ingestion\Contracts\PlanSourceAdapter;
use App\Services\Plans\Ingestion\Data\FetchedPlanSource;
use App\Services\Plans\Ingestion\Normalizers\CanonicalUkPlanNormalizer;
use App\Services\Plans\Ingestion\PlanImportService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

final class PlanImportServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_import_is_idempotent_and_detects_price_changes(): void
    {
        [$source, $adapter] = $this->sourceAndAdapter([$this->record(10)]);
        $service = app(PlanImportService::class);
        $first = $service->import($source, $adapter, new CanonicalUkPlanNormalizer);
        $second = $service->import($source, $adapter, new CanonicalUkPlanNormalizer);
        $this->assertFalse($first['unchanged']);
        $this->assertTrue($second['unchanged']);
        $this->assertDatabaseCount('mobile_plans', 1);
        $this->assertDatabaseCount('plan_source_snapshots', 1);

        $adapter->payload = ['plans' => [$this->record(12)]];
        $service->import($source, $adapter, new CanonicalUkPlanNormalizer);
        $this->assertSame('12.00', MobilePlan::first()->price);
        $this->assertDatabaseHas('plan_changes', ['change_type' => 'price_changed']);
        $this->assertDatabaseCount('plan_price_history', 2);
    }

    public function test_one_disappearance_does_not_delete_or_deactivate_plan(): void
    {
        [$source, $adapter] = $this->sourceAndAdapter([$this->record(10)]);
        $service = app(PlanImportService::class);
        $normalizer = new CanonicalUkPlanNormalizer;
        $service->import($source, $adapter, $normalizer);
        $adapter->payload = ['plans' => [], 'observation' => 1];
        $service->import($source, $adapter, $normalizer);
        $this->assertDatabaseHas('mobile_plans', ['status' => 'active', 'missing_observations' => 1]);
        $adapter->payload = ['plans' => [], 'observation' => 2];
        $service->import($source, $adapter, $normalizer);
        $this->assertDatabaseHas('mobile_plans', ['status' => 'inactive', 'missing_observations' => 2]);
    }

    public function test_return_and_feature_change_are_both_recorded(): void
    {
        [$source, $adapter] = $this->sourceAndAdapter([$this->record(10)]);
        $service = app(PlanImportService::class);
        $normalizer = new CanonicalUkPlanNormalizer;
        $service->import($source, $adapter, $normalizer);
        $adapter->payload = ['plans' => [], 'observation' => 1];
        $service->import($source, $adapter, $normalizer);
        $returned = $this->record(10);
        $returned['features']['wifi_calling'] = false;
        $adapter->payload = ['plans' => [$returned], 'observation' => 2];
        $service->import($source, $adapter, $normalizer);

        $this->assertDatabaseHas('plan_changes', ['change_type' => 'returned']);
        $this->assertDatabaseHas('plan_changes', ['change_type' => 'feature_changed']);
        $this->assertDatabaseHas('mobile_plans', ['status' => 'active', 'missing_observations' => 0, 'verification_status' => 'verified']);
    }

    public function test_normalizer_rejects_malformed_source_records(): void
    {
        [$source, $adapter] = $this->sourceAndAdapter([]);
        $adapter->payload = ['plans' => [['name' => 'Missing provenance']]];
        try {
            app(PlanImportService::class)->import($source, $adapter, new CanonicalUkPlanNormalizer);
            $this->fail('Malformed records must be rejected.');
        } catch (ValidationException) {
            $this->assertDatabaseHas('plan_source_snapshots', ['plan_source_id' => $source->id, 'fetch_status' => 'failed']);
            $this->assertDatabaseCount('mobile_plans', 0);
        }
    }

    private function sourceAndAdapter(array $plans): array
    {
        $country = Country::create(['name' => 'United Kingdom', 'iso2' => 'GB', 'iso3' => 'GBR', 'slug' => 'united-kingdom', 'active' => true]);
        Operator::create(['country_id' => $country->id, 'name' => 'Fixture Mobile', 'slug' => 'fixture-mobile', 'active' => true]);
        $source = PlanSource::create(['country_id' => $country->id, 'name' => 'Fixture source', 'slug' => 'fixture-source', 'url' => 'https://example.test/plans.json', 'adapter_class' => 'fixture']);
        $adapter = new class(['plans' => $plans]) implements PlanSourceAdapter
        {
            public function __construct(public array $payload) {}

            public function fetch(PlanSource $source): FetchedPlanSource
            {
                return new FetchedPlanSource($this->payload, $source->url);
            }
        };

        return [$source, $adapter];
    }

    private function record(float $price): array
    {
        return ['source_key' => 'fixture-1', 'operator_slug' => 'fixture-mobile', 'name' => 'Fixture 20GB', 'slug' => 'fixture-20gb', 'plan_type' => 'sim_only', 'status' => 'active', 'price' => $price, 'currency' => 'GBP', 'billing_period' => 'monthly', 'data_allowance_mb' => 20480, 'unlimited_data' => false, 'five_g' => true, 'esim' => true, 'verification_status' => 'verified', 'last_verified_at' => '2026-09-07T00:00:00Z', 'source_url' => 'https://example.test/fixture-1', 'features' => ['wifi_calling' => true]];
    }
}
