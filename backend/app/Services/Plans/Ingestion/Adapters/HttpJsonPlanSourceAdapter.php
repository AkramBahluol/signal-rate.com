<?php

namespace App\Services\Plans\Ingestion\Adapters;

use App\Models\PlanSource;
use App\Services\Plans\Ingestion\Contracts\PlanSourceAdapter;
use App\Services\Plans\Ingestion\Data\FetchedPlanSource;
use Illuminate\Support\Facades\Http;
use RuntimeException;

final class HttpJsonPlanSourceAdapter implements PlanSourceAdapter
{
    public function fetch(PlanSource $source): FetchedPlanSource
    {
        $response = Http::acceptJson()->timeout(20)->retry(2, 300)->get($source->url);
        if (! $response->successful() || ! is_array($response->json())) {
            throw new RuntimeException("Plan source {$source->slug} returned an invalid response ({$response->status()}).");
        }

        return new FetchedPlanSource($response->json(), $source->url, $response->status());
    }
}
