<?php

namespace App\Services\Plans\Ingestion\Contracts;

interface PlanNormalizer
{
    /** @return list<array<string, mixed>> */
    public function normalize(array $payload): array;
}
