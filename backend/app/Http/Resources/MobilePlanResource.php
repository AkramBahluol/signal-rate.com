<?php

namespace App\Http\Resources;

use App\Services\Plans\PlanMetrics;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

final class MobilePlanResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id, 'name' => $this->name, 'slug' => $this->slug,
            'plan_type' => $this->plan_type?->value ?? $this->plan_type, 'status' => $this->status?->value ?? $this->status,
            'price' => $this->price, 'currency' => $this->currency, 'billing_period' => $this->billing_period,
            'data_allowance_mb' => $this->data_allowance_mb, 'unlimited_data' => $this->unlimited_data,
            'calls_allowance_minutes' => $this->calls_allowance_minutes, 'unlimited_calls' => $this->unlimited_calls,
            'sms_allowance' => $this->sms_allowance, 'unlimited_sms' => $this->unlimited_sms,
            'four_g' => $this->four_g, 'five_g' => $this->five_g, 'esim' => $this->esim,
            'hotspot_allowed' => $this->hotspot_allowed, 'hotspot_allowance_mb' => $this->hotspot_allowance_mb,
            'roaming' => $this->roaming, 'roaming_notes' => $this->roaming_notes,
            'international_calls' => $this->international_calls, 'international_notes' => $this->international_notes,
            'contract_length_months' => $this->contract_length_months,
            'activation_fee' => $this->activation_fee, 'upfront_fee' => $this->upfront_fee,
            'fair_usage_policy' => $this->fair_usage_policy,
            'cost_per_gb' => PlanMetrics::costPerGb($this->resource), 'total_contract_cost' => PlanMetrics::totalContractCost($this->resource),
            'source_name' => $this->source_name, 'source_url' => $this->source_url,
            'last_verified_at' => $this->last_verified_at?->toIso8601String(), 'verification_status' => $this->verification_status?->value ?? $this->verification_status,
            'first_seen_at' => $this->first_seen_at?->toIso8601String(), 'last_seen_at' => $this->last_seen_at?->toIso8601String(),
            'country' => $this->whenLoaded('country'), 'operator' => $this->whenLoaded('operator'),
            'features' => $this->whenLoaded('features'), 'price_history' => $this->whenLoaded('priceHistory'),
        ];
    }
}
