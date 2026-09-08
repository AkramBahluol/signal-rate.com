<?php

namespace App\Services\Plans\Ingestion\Normalizers;

use App\Enums\PlanStatus;
use App\Enums\PlanType;
use App\Enums\VerificationStatus;
use App\Services\Plans\Ingestion\Contracts\PlanNormalizer;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

final class CanonicalUkPlanNormalizer implements PlanNormalizer
{
    public function normalize(array $payload): array
    {
        $plans = $payload['plans'] ?? [];
        Validator::make(['plans' => $plans], ['plans' => ['present', 'array']])->validate();

        return array_map(function (array $plan): array {
            $data = Validator::make($plan, [
                'source_key' => ['required', 'string', 'max:190'], 'operator_slug' => ['required', 'string', 'max:190'],
                'name' => ['required', 'string', 'max:190'], 'slug' => ['required', 'string', 'max:190'],
                'plan_type' => ['required', Rule::enum(PlanType::class)], 'status' => ['required', Rule::enum(PlanStatus::class)],
                'price' => ['required', 'numeric', 'min:0'], 'currency' => ['required', 'string', 'size:3'],
                'billing_period' => ['nullable', 'string', 'max:50'], 'data_allowance_mb' => ['nullable', 'integer', 'min:0'],
                'unlimited_data' => ['required', 'boolean'], 'verification_status' => ['required', Rule::enum(VerificationStatus::class)],
                'last_verified_at' => ['required', 'date'], 'source_url' => ['required', 'url'],
                'features' => ['nullable', 'array'],
            ])->validate();
            foreach (['unlimited_calls', 'unlimited_sms', 'four_g', 'five_g', 'esim', 'roaming', 'hotspot_allowed', 'international_calls'] as $boolean) {
                $data[$boolean] = (bool) ($plan[$boolean] ?? false);
            }
            foreach (['calls_allowance_minutes', 'sms_allowance', 'hotspot_allowance_mb', 'contract_length_months', 'billing_period_days'] as $integer) {
                $data[$integer] = isset($plan[$integer]) ? (int) $plan[$integer] : null;
            }
            foreach (['activation_fee', 'upfront_fee'] as $money) {
                $data[$money] = (float) ($plan[$money] ?? 0);
            }
            foreach (['roaming_notes', 'international_notes', 'fair_usage_policy'] as $text) {
                $data[$text] = $plan[$text] ?? null;
            }

            return $data;
        }, $plans);
    }
}
