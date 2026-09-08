<?php

namespace App\Services\Network\Providers;

use App\Services\Network\Contracts\AsnProvider;
use App\Services\Network\ProviderResult;

final class UnavailableAsnProvider implements AsnProvider
{
    public function lookupIp(string $ip): ProviderResult
    {
        return ProviderResult::unavailable('asn', null, 'No ASN dataset is configured.');
    }

    public function lookupAsn(int $asn): ProviderResult
    {
        return ProviderResult::unavailable('asn', null, 'No ASN dataset is configured.');
    }
}
