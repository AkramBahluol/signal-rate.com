<?php

namespace App\Services\Plans\Ingestion;

use App\Enums\PlanStatus;
use App\Models\MobilePlan;
use App\Models\Operator;
use App\Models\PlanChange;
use App\Models\PlanFeature;
use App\Models\PlanPrice;
use App\Models\PlanPriceHistory;
use App\Models\PlanSource;
use App\Models\PlanSourceSnapshot;
use App\Models\PlanVerification;
use App\Services\Plans\Ingestion\Contracts\PlanNormalizer;
use App\Services\Plans\Ingestion\Contracts\PlanSourceAdapter;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final class PlanImportService
{
    public function import(PlanSource $source, PlanSourceAdapter $adapter, PlanNormalizer $normalizer): array
    {
        try {
            $fetched = $adapter->fetch($source);
        } catch (\Throwable $exception) {
            PlanSourceSnapshot::create(['plan_source_id' => $source->id, 'source_url' => $source->url, 'checksum' => hash('sha256', $exception->getMessage().now()->toIso8601String()), 'fetch_status' => 'failed', 'error_message' => $exception->getMessage(), 'retrieved_at' => now()]);
            throw $exception;
        }

        $checksum = hash('sha256', json_encode($fetched->payload, JSON_THROW_ON_ERROR));
        $existing = PlanSourceSnapshot::where('plan_source_id', $source->id)->where('checksum', $checksum)->first();
        if ($existing?->fetch_status === 'success') {
            return ['snapshot_id' => $existing->id, 'unchanged' => true, 'processed' => 0];
        }

        $snapshot = $existing ?: PlanSourceSnapshot::create(['plan_source_id' => $source->id, 'source_url' => $fetched->url, 'checksum' => $checksum, 'fetch_status' => 'pending', 'http_status' => $fetched->httpStatus, 'payload' => $fetched->payload, 'retrieved_at' => now()]);
        $snapshot->update(['fetch_status' => 'pending', 'http_status' => $fetched->httpStatus, 'payload' => $fetched->payload, 'error_message' => null, 'retrieved_at' => now()]);

        try {
            $records = $normalizer->normalize($fetched->payload);
            $result = DB::transaction(function () use ($source, $snapshot, $records): array {
                $seen = [];
                foreach ($records as $record) {
                    $seen[] = $record['source_key'];
                    $this->upsertPlan($source, $snapshot, $record);
                }
                $this->markMissing($source, $seen);
                $source->update(['last_fetched_at' => now()]);

                return ['snapshot_id' => $snapshot->id, 'unchanged' => false, 'processed' => count($records)];
            });
            $snapshot->update(['fetch_status' => 'success']);

            return $result;
        } catch (\Throwable $exception) {
            $snapshot->update(['fetch_status' => 'failed', 'error_message' => $exception->getMessage()]);
            throw $exception;
        }
    }

    private function upsertPlan(PlanSource $source, PlanSourceSnapshot $snapshot, array $record): void
    {
        $operator = Operator::where('country_id', $source->country_id)->where('slug', $record['operator_slug'])->first();
        if (! $operator) {
            throw ValidationException::withMessages(['operator_slug' => "Unknown operator {$record['operator_slug']} for source {$source->slug}."]);
        }
        $features = Arr::pull($record, 'features', []);
        unset($record['operator_slug']);
        $plan = MobilePlan::where('plan_source_id', $source->id)->where('source_key', $record['source_key'])->first();
        $changeTypes = $plan ? [] : ['new'];
        $previousPrice = $plan?->price;
        $wasMissing = $plan && $plan->missing_observations > 0;
        $featureChanged = false;
        $attributes = [...$record, 'plan_source_id' => $source->id, 'operator_id' => $operator->id, 'country_id' => $source->country_id, 'source_name' => $source->name, 'first_seen_at' => $plan?->first_seen_at ?? now(), 'last_seen_at' => now(), 'missing_observations' => 0];
        $plan ? $plan->update($attributes) : $plan = MobilePlan::create($attributes);
        if ($wasMissing) {
            $changeTypes[] = 'returned';
        }
        if ($previousPrice !== null && (float) $previousPrice !== (float) $plan->price) {
            $changeTypes[] = 'price_changed';
        }

        foreach ($features as $key => $value) {
            $existing = $plan->features()->where('feature_key', $key)->first();
            if ($existing && $existing->value !== ['value' => $value]) {
                $featureChanged = true;
            }
            PlanFeature::updateOrCreate(['mobile_plan_id' => $plan->id, 'feature_key' => $key], ['value' => ['value' => $value], 'source_name' => $source->name, 'source_url' => $record['source_url'], 'last_verified_at' => $record['last_verified_at'], 'verification_status' => $record['verification_status']]);
        }
        if ($featureChanged) {
            $changeTypes[] = 'feature_changed';
        }
        foreach (array_unique($changeTypes) as $changeType) {
            PlanChange::create(['mobile_plan_id' => $plan->id, 'plan_source_id' => $source->id, 'change_type' => $changeType, 'changes' => ['previous_price' => $previousPrice, 'new_price' => $plan->price], 'observed_at' => now()]);
        }
        if ($previousPrice === null || (float) $previousPrice !== (float) $plan->price) {
            PlanPrice::where('mobile_plan_id', $plan->id)->where('is_current', true)->update(['is_current' => false, 'effective_to' => now()]);
            PlanPrice::create(['mobile_plan_id' => $plan->id, 'price' => $plan->price, 'currency' => $plan->currency, 'billing_period' => $plan->billing_period, 'billing_period_days' => $plan->billing_period_days, 'activation_fee' => $plan->activation_fee, 'upfront_fee' => $plan->upfront_fee, 'is_current' => true, 'effective_from' => now(), 'observed_at' => now(), 'source_name' => $source->name, 'source_url' => $plan->source_url, 'verification_status' => $plan->verification_status]);
            PlanPriceHistory::create(['mobile_plan_id' => $plan->id, 'price' => $plan->price, 'previous_price' => $previousPrice, 'new_price' => $plan->price, 'currency' => $plan->currency, 'effective_from' => now()->toDateString(), 'observed_at' => now(), 'source_name' => $source->name, 'source_url' => $plan->source_url, 'verification_status' => $plan->verification_status]);
        }
        PlanVerification::create(['mobile_plan_id' => $plan->id, 'plan_source_id' => $source->id, 'plan_source_snapshot_id' => $snapshot->id, 'verification_status' => $plan->verification_status, 'checked_at' => $plan->last_verified_at, 'source_name' => $source->name, 'source_url' => $plan->source_url]);
    }

    private function markMissing(PlanSource $source, array $seen): void
    {
        MobilePlan::where('plan_source_id', $source->id)->when($seen, fn ($q) => $q->whereNotIn('source_key', $seen))->each(function (MobilePlan $plan) use ($source): void {
            $count = $plan->missing_observations + 1;
            $plan->update(['missing_observations' => $count, 'status' => $count >= 2 ? PlanStatus::Inactive : $plan->status]);
            PlanChange::create(['mobile_plan_id' => $plan->id, 'plan_source_id' => $source->id, 'change_type' => 'disappeared', 'changes' => ['consecutive_missing_observations' => $count], 'observed_at' => now()]);
        });
    }
}
