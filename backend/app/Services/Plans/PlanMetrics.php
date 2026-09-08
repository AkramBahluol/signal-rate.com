<?php

namespace App\Services\Plans;

use App\Models\MobilePlan;

final class PlanMetrics
{
    public static function costPerGb(MobilePlan $plan): ?float
    {
        if ($plan->unlimited_data || ! $plan->data_allowance_mb || $plan->data_allowance_mb <= 0 || $plan->price === null) {
            return null;
        }

        return round((float) $plan->price / ($plan->data_allowance_mb / 1024), 2);
    }

    public static function totalContractCost(MobilePlan $plan): ?float
    {
        if ($plan->price === null) {
            return null;
        }

        $periods = max(1, (int) ($plan->contract_length_months ?: 1));

        return round(((float) $plan->price * $periods) + (float) $plan->activation_fee + (float) $plan->upfront_fee, 2);
    }
}
