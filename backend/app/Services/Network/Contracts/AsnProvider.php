<?php

namespace App\Services\Network\Contracts;

use App\Services\Network\ProviderResult;

interface AsnProvider
{
    public function lookupIp(string $ip): ProviderResult;

    public function lookupAsn(int $asn): ProviderResult;
}
