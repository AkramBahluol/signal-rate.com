<?php

namespace App\Services\Network\Contracts;

use App\Services\Network\ProviderResult;

interface GeoIpProvider
{
    public function lookup(string $ip): ProviderResult;
}
