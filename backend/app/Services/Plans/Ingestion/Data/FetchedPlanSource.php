<?php

namespace App\Services\Plans\Ingestion\Data;

final readonly class FetchedPlanSource
{
    public function __construct(public array $payload, public string $url, public int $httpStatus = 200) {}
}
