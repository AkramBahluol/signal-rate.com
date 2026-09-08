<?php

namespace App\Services\Network;

use App\Services\Network\Contracts\DnsResolver;
use InvalidArgumentException;

final class PortChecker
{
    public function __construct(
        private readonly NetworkAddress $addresses,
        private readonly HostnameValidator $hostnames,
        private readonly DnsResolver $dns,
    ) {}

    public function check(string $host, int $port): array
    {
        if ($port < 1 || $port > 65535) {
            throw new InvalidArgumentException('Port must be between 1 and 65535.');
        }
        $host = trim($host);
        if (filter_var($host, FILTER_VALIDATE_IP)) {
            $target = $this->addresses->normalize($host);
            $this->assertPublic($target);
            $displayHost = $target;
        } else {
            $displayHost = $this->hostnames->normalize($host);
            $first = $this->resolvePublic($displayHost);
            $second = $this->resolvePublic($displayHost);
            sort($first);
            sort($second);
            if ($first !== $second) {
                throw new InvalidArgumentException('Hostname addresses changed during validation; the check was blocked.');
            }
            $target = $second[0];
        }

        $endpoint = $this->addresses->version($target) === 6 ? "tcp://[{$target}]:{$port}" : "tcp://{$target}:{$port}";
        $started = hrtime(true);
        $socket = @stream_socket_client($endpoint, $errorCode, $errorMessage, config('network.socket_timeout_seconds'), STREAM_CLIENT_CONNECT);
        $duration = round((hrtime(true) - $started) / 1_000_000, 2);
        $reachable = is_resource($socket);
        if ($reachable) {
            fclose($socket);
        }

        return ['host' => $displayHost, 'resolved_ip' => $target, 'port' => $port, 'reachable' => $reachable, 'status' => $reachable ? 'open' : 'closed_or_filtered', 'duration_ms' => $duration, 'checked_at' => now()->toIso8601String(), 'note' => 'Reachability is measured from the SignalRate backend, not from your device.'];
    }

    private function resolvePublic(string $hostname): array
    {
        $ips = [];
        foreach (['A', 'AAAA'] as $type) {
            foreach ($this->dns->lookup($hostname, $type)['records'] as $record) {
                if (filter_var($record['value'] ?? null, FILTER_VALIDATE_IP)) {
                    $ips[] = $this->addresses->normalize($record['value']);
                }
            }
        }
        $ips = array_values(array_unique($ips));
        if ($ips === []) {
            throw new InvalidArgumentException('Hostname did not resolve to an IP address.');
        }
        foreach ($ips as $ip) {
            $this->assertPublic($ip);
        }

        return $ips;
    }

    private function assertPublic(string $ip): void
    {
        if ($this->addresses->isCloudMetadata($ip)) {
            throw new InvalidArgumentException('Cloud metadata addresses are blocked.');
        }
        if (! $this->addresses->isPublic($ip)) {
            throw new InvalidArgumentException('Loopback, private, reserved, link-local, multicast, and internal addresses are blocked.');
        }
    }
}
