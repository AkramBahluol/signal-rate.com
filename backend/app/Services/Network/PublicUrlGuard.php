<?php

namespace App\Services\Network;

use App\Services\Network\Contracts\DnsResolver;
use InvalidArgumentException;

final class PublicUrlGuard
{
    public function __construct(private readonly NetworkAddress $addresses, private readonly HostnameValidator $hostnames, private readonly DnsResolver $dns) {}

    public function validate(string $input): array
    {
        $url = filter_var(trim($input), FILTER_VALIDATE_URL);
        if (! is_string($url)) {
            throw new InvalidArgumentException('Enter a valid absolute URL.');
        }
        $parts = parse_url($url);
        if (! in_array(strtolower($parts['scheme'] ?? ''), ['http', 'https'], true)) {
            throw new InvalidArgumentException('Only HTTP and HTTPS URLs are allowed.');
        }
        if (isset($parts['user']) || isset($parts['pass'])) {
            throw new InvalidArgumentException('URLs containing credentials are blocked.');
        }
        $host = $parts['host'] ?? '';
        if ($host === '') {
            throw new InvalidArgumentException('URL hostname is required.');
        }
        $host = filter_var($host, FILTER_VALIDATE_IP) ? $this->addresses->normalize($host) : $this->hostnames->normalize($host);
        $first = $this->resolve($host);
        $second = $this->resolve($host);
        sort($first);
        sort($second);
        if ($first !== $second) {
            throw new InvalidArgumentException('Hostname addresses changed during validation; the request was blocked.');
        }

        return ['url' => $url, 'scheme' => strtolower($parts['scheme']), 'host' => $host, 'port' => (int) ($parts['port'] ?? (($parts['scheme'] ?? '') === 'https' ? 443 : 80)), 'ips' => $second];
    }

    private function resolve(string $host): array
    {
        $ips = filter_var($host, FILTER_VALIDATE_IP) ? [$host] : [];
        if ($ips === []) {
            foreach (['A', 'AAAA'] as $type) {
                foreach ($this->dns->lookup($host, $type)['records'] as $record) {
                    if (filter_var($record['value'] ?? null, FILTER_VALIDATE_IP)) {
                        $ips[] = $this->addresses->normalize($record['value']);
                    }
                }
            }
        }
        $ips = array_values(array_unique($ips));
        if ($ips === []) {
            throw new InvalidArgumentException('Hostname did not resolve to an IP address.');
        }
        foreach ($ips as $ip) {
            if ($this->addresses->isCloudMetadata($ip)) {
                throw new InvalidArgumentException('Cloud metadata addresses are blocked.');
            }
            if (! $this->addresses->isPublic($ip)) {
                throw new InvalidArgumentException('Private, loopback, reserved, link-local, multicast, and internal targets are blocked.');
            }
        }

        return $ips;
    }
}
