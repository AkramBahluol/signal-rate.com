<?php

namespace App\Services\Network;

use App\Services\Network\Contracts\AsnProvider;
use Illuminate\Support\Facades\Cache;

final class AsnLookupService
{
    public function __construct(private readonly Asn $asns, private readonly AsnProvider $provider) {}

    public function lookup(string $asn): array
    {
        $value = $this->asns->normalize($asn);

        return Cache::remember("network:asn:{$value}", config('network.lookup_cache_seconds'), function () use ($value): array {
            try {
                $result = $this->provider->lookupAsn($value);
            } catch (\Throwable) {
                $result = ProviderResult::failed('asn', null, 'ASN provider lookup failed or timed out.');
            }

            return ['asn' => "AS{$value}", ...$result->toArray()];
        });
    }
}
