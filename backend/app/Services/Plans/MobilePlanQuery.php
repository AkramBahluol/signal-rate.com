<?php

namespace App\Services\Plans;

use App\Models\MobilePlan;
use Illuminate\Database\Eloquent\Builder;

final class MobilePlanQuery
{
    public function build(array $filters): Builder
    {
        $query = MobilePlan::query()->where('status', 'active')->with(['country', 'operator', 'features', 'priceHistory' => fn ($q) => $q->orderBy('observed_at')]);
        if ($country = $filters['country'] ?? null) {
            $query->whereHas('country', fn ($q) => $q->where('iso2', strtoupper($country)));
        }
        if ($operator = $filters['operator'] ?? null) {
            $query->whereHas('operator', fn ($q) => $q->where('slug', $operator)->orWhereLike('name', "%{$operator}%")->orWhereLike('brand', "%{$operator}%"));
        }
        if ($term = $filters['q'] ?? null) {
            $query->where(fn ($q) => $q->whereLike('name', "%{$term}%")->orWhereHas('operator', fn ($o) => $o->whereLike('name', "%{$term}%")->orWhereLike('brand', "%{$term}%")));
        }
        if (isset($filters['price_min'])) {
            $query->where('price', '>=', $filters['price_min']);
        }
        if (isset($filters['price_max'])) {
            $query->where('price', '<=', $filters['price_max']);
        }
        if (isset($filters['data_min'])) {
            $query->where(fn ($q) => $q->where('unlimited_data', true)->orWhere('data_allowance_mb', '>=', $filters['data_min'] * 1024));
        }
        foreach (['unlimited' => 'unlimited_data', '5g' => 'five_g', 'esim' => 'esim'] as $input => $column) {
            if (isset($filters[$input])) {
                $query->where($column, filter_var($filters[$input], FILTER_VALIDATE_BOOL));
            }
        }
        if ($type = $filters['plan_type'] ?? null) {
            $query->where('plan_type', $type);
        }
        if (isset($filters['contract_length'])) {
            $query->where('contract_length_months', '<=', $filters['contract_length']);
        }

        return match ($filters['sort'] ?? 'cheapest') {
            'most_data' => $query->orderByDesc('unlimited_data')->orderByDesc('data_allowance_mb'),
            'cost_per_gb' => $query->where('unlimited_data', false)->where('data_allowance_mb', '>', 0)->whereNotNull('price')->orderByRaw('price / (data_allowance_mb / 1024.0)'),
            'shortest_contract' => $query->orderByRaw('contract_length_months IS NULL')->orderBy('contract_length_months'),
            'newest' => $query->latest('last_seen_at'),
            default => $query->orderByRaw('price IS NULL')->orderBy('price'),
        };
    }
}
