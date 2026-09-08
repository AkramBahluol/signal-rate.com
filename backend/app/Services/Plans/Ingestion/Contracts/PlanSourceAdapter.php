<?php

namespace App\Services\Plans\Ingestion\Contracts;

use App\Models\PlanSource;
use App\Services\Plans\Ingestion\Data\FetchedPlanSource;

interface PlanSourceAdapter
{
    public function fetch(PlanSource $source): FetchedPlanSource;
}
