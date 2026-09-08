<?php

namespace App\Services\Network;

use App\Services\Network\Contracts\AsnProvider;
use App\Services\Network\Contracts\GeoIpProvider;
use App\Services\Network\Contracts\RdapProvider;
use App\Services\Network\Contracts\ReverseDnsResolver;
use Illuminate\Support\Facades\Cache;

final class NetworkLookupService
{
    public function __construct(
        private readonly NetworkAddress $addresses,
        private readonly GeoIpProvider $geoIp,
        private readonly AsnProvider $asn,
        private readonly RdapProvider $rdap,
        private readonly ReverseDnsResolver $reverseDns,
    ) {}

    public function lookup(string $ip): array
    {
        $ip = $this->addresses->normalize($ip);
        $classification = $this->addresses->classification($ip);
        if (! $classification['public']) {
            return ['ip' => $ip, 'version' => $classification['version'], 'address_scope' => 'Non-public address observed. In local development this is normally the Docker gateway; in production verify trusted-proxy configuration.', 'approximate_country' => null, 'approximate_region' => null, 'approximate_city' => null, 'timezone' => null, 'asn_number' => null, 'organization' => null, 'isp' => null, 'network_range' => null, 'ptr_hostnames' => [], 'classification' => $classification, 'geolocation' => ProviderResult::unavailable('geoip', null, 'Public addresses only.')->toArray(), 'asn' => ProviderResult::unavailable('asn', null, 'Public addresses only.')->toArray(), 'rdap' => ProviderResult::unavailable('rdap', null, 'Public addresses only.')->toArray(), 'reverse_dns' => ProviderResult::unavailable('reverse-dns', null, 'Public addresses only.')->toArray(), 'retrieved_at' => now()->toIso8601String()];
        }

        return Cache::remember('network:ip:'.hash('sha256', $ip), config('network.lookup_cache_seconds'), function () use ($ip, $classification): array {
            $geo = $this->safe(fn () => $this->geoIp->lookup($ip), 'geoip');
            $asn = $this->safe(fn () => $this->asn->lookupIp($ip), 'asn');
            $rdap = $this->safe(fn () => $this->rdap->lookup($ip), 'rdap');
            $reverse = $this->safe(fn () => $this->reverseDns->lookup($ip), 'reverse-dns');

            return [
                'ip' => $ip, 'version' => $classification['version'], 'address_scope' => 'Public address observed by SignalRate.', 'classification' => $classification,
                'approximate_country' => $geo->data['country'] ?? $geo->data['country_code'] ?? null,
                'approximate_region' => $geo->data['region'] ?? null, 'approximate_city' => $geo->data['city'] ?? null,
                'timezone' => $geo->data['timezone'] ?? null, 'latitude' => $geo->data['latitude'] ?? null, 'longitude' => $geo->data['longitude'] ?? null,
                'asn_number' => $asn->data['asn'] ?? null, 'organization' => $asn->data['organization'] ?? $geo->data['organization'] ?? null,
                'isp' => $geo->data['isp'] ?? null,
                'network_range' => $asn->data['network_range'] ?? (isset($rdap->data['start_address'], $rdap->data['end_address']) ? $rdap->data['start_address'].' – '.$rdap->data['end_address'] : null),
                'ptr_hostnames' => $reverse->data['hostnames'] ?? [], 'rdap_url' => $rdap->source,
                'geolocation' => $geo->toArray(), 'asn' => $asn->toArray(), 'rdap' => $rdap->toArray(), 'reverse_dns' => $reverse->toArray(),
                'retrieved_at' => now()->toIso8601String(),
            ];
        });
    }

    public function rdap(string $ip): array
    {
        $ip = $this->addresses->normalize($ip);
        if (! $this->addresses->isPublic($ip)) {
            return ProviderResult::unavailable('rdap', null, 'RDAP is only queried for public addresses.')->toArray();
        }

        return Cache::remember('network:rdap:'.hash('sha256', $ip), config('network.lookup_cache_seconds'), fn (): array => $this->safe(fn () => $this->rdap->lookup($ip), 'rdap')->toArray());
    }

    public function reverseDns(string $ip): array
    {
        $ip = $this->addresses->normalize($ip);

        return Cache::remember('network:ptr:'.hash('sha256', $ip), 300, fn (): array => $this->safe(fn () => $this->reverseDns->lookup($ip), 'reverse-dns')->toArray());
    }

    private function safe(callable $callback, string $provider): ProviderResult
    {
        try {
            return $callback();
        } catch (\Throwable) {
            return ProviderResult::failed($provider, null, 'Provider lookup failed or timed out.');
        }
    }
}
