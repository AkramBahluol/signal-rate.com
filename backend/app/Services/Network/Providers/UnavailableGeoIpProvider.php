<?php

namespace App\Services\Network\Providers;

use App\Services\Network\Contracts\GeoIpProvider;
use App\Services\Network\ProviderResult;

final class UnavailableGeoIpProvider implements GeoIpProvider
{
    public function lookup(string $ip): ProviderResult
    {
        return ProviderResult::unavailable('geoip', null, 'No licensed GeoIP dataset is configured.');
    }
}
