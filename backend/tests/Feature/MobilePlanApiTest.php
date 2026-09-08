<?php

namespace Tests\Feature;

use App\Enums\PlanStatus;
use App\Enums\PlanType;
use App\Enums\VerificationStatus;
use App\Models\Country;
use App\Models\MobilePlan;
use App\Models\Operator;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

final class MobilePlanApiTest extends TestCase
{
    use RefreshDatabase;

    private Country $country;

    private Operator $operator;

    protected function setUp(): void
    {
        parent::setUp();
        $this->country = Country::create(['name' => 'United Kingdom', 'official_name' => 'United Kingdom', 'iso2' => 'GB', 'iso3' => 'GBR', 'numeric_code' => '826', 'slug' => 'united-kingdom', 'currency_code' => 'GBP', 'active' => true]);
        $this->operator = Operator::create(['country_id' => $this->country->id, 'name' => 'Fixture Mobile', 'slug' => 'fixture-mobile', 'active' => true]);
    }

    public function test_filters_and_rankings_are_applied(): void
    {
        $this->plan(['name' => 'Finite 20GB', 'slug' => 'finite-20gb', 'price' => 10, 'data_allowance_mb' => 20480]);
        $this->plan(['name' => 'Unlimited', 'slug' => 'unlimited', 'price' => 20, 'unlimited_data' => true, 'five_g' => true, 'esim' => true]);

        $this->getJson('/api/v1/mobile-plans/country/gb?price_max=15&data_min=10&sort=cost_per_gb')
            ->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.cost_per_gb', 0.5);
        $this->getJson('/api/v1/mobile-plans/search?country=GB&unlimited=1&5g=1&esim=1')
            ->assertOk()->assertJsonPath('data.0.name', 'Unlimited')->assertJsonPath('data.0.cost_per_gb', null);
    }

    public function test_detail_includes_objective_total_contract_cost(): void
    {
        $plan = $this->plan(['price' => 12, 'contract_length_months' => 12, 'activation_fee' => 5, 'upfront_fee' => 10]);
        $this->getJson('/api/v1/mobile-plans/'.$plan->id)->assertOk()->assertJsonPath('data.total_contract_cost', 159);
    }

    public function test_invalid_filters_return_useful_422_response(): void
    {
        $this->getJson('/api/v1/mobile-plans?price_min=-1&plan_type=imaginary')->assertUnprocessable()->assertJsonValidationErrors(['price_min', 'plan_type']);
    }

    public function test_operator_endpoint_and_global_search_find_plans(): void
    {
        $this->plan(['name' => 'Finder Plan']);
        $this->getJson('/api/v1/mobile-plans/country/GB/operator/fixture-mobile')->assertOk()->assertJsonCount(1, 'data');
        $this->getJson('/api/v1/search?q=Finder')->assertOk()->assertJsonFragment(['type' => 'mobile_plan', 'title' => 'Finder Plan']);
    }

    private function plan(array $overrides = []): MobilePlan
    {
        return MobilePlan::create(array_merge(['operator_id' => $this->operator->id, 'country_id' => $this->country->id, 'name' => 'Fixture Plan', 'slug' => 'fixture-plan-'.uniqid(), 'plan_type' => PlanType::SimOnly, 'status' => PlanStatus::Active, 'price' => 15, 'currency' => 'GBP', 'billing_period' => 'monthly', 'unlimited_data' => false, 'unlimited_calls' => true, 'unlimited_sms' => true, 'four_g' => true, 'five_g' => false, 'esim' => false, 'roaming' => false, 'activation_fee' => 0, 'upfront_fee' => 0, 'verification_status' => VerificationStatus::Verified, 'source_name' => 'Test fixture', 'source_url' => 'https://example.test/plans', 'last_verified_at' => now(), 'first_seen_at' => now(), 'last_seen_at' => now()], $overrides));
    }
}
