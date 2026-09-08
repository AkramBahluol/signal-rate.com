<?php

namespace App\Services\Network;

use App\Services\Network\Contracts\DnsResolver;
use Illuminate\Support\Facades\Cache;

final class DnsLookupService
{
    public function __construct(private readonly DnsResolver $resolver, private readonly HostnameValidator $hostnames) {}

    public function lookup(string $hostname, string $type): array
    {
        $hostname = $this->hostnames->normalize($hostname);
        $type = strtoupper($type);
        $key = 'network:dns:'.hash('sha256', "{$hostname}:{$type}");

        $cached = Cache::get($key);
        if (is_array($cached)) {
            return $cached;
        }
        $result = $this->resolver->lookup($hostname, $type);
        $ttls = array_filter(array_column($result['records'], 'ttl'), fn ($ttl) => is_int($ttl) && $ttl > 0);
        $ttl = $ttls ? max(1, min(min($ttls), config('network.dns_cache_max_seconds'))) : 60;
        $result['cache_ttl_seconds'] = $ttl;
        Cache::put($key, $result, $ttl);

        return $result;
    }

    public function hostname(string $hostname): array
    {
        $hostname = $this->hostnames->normalize($hostname);
        $a = $this->lookup($hostname, 'A');
        $aaaa = $this->lookup($hostname, 'AAAA');
        $cname = $this->lookup($hostname, 'CNAME');

        return ['hostname' => $hostname, 'ipv4' => array_column($a['records'], 'value'), 'ipv6' => array_column($aaaa['records'], 'value'), 'canonical_names' => array_column($cname['records'], 'value'), 'retrieved_at' => now()->toIso8601String(), 'provider' => 'system-resolver'];
    }
}
