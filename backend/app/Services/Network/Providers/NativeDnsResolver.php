<?php

namespace App\Services\Network\Providers;

use App\Services\Network\Contracts\DnsResolver;
use App\Services\Network\HostnameValidator;
use InvalidArgumentException;

final class NativeDnsResolver implements DnsResolver
{
    public function __construct(private readonly HostnameValidator $hostnames) {}

    public function lookup(string $hostname, string $type): array
    {
        $hostname = $this->normalizeDnsName($hostname);
        $type = strtoupper($type);
        $constant = match ($type) {
            'A' => DNS_A, 'AAAA' => DNS_AAAA, 'CNAME' => DNS_CNAME, 'MX' => DNS_MX,
            'TXT' => DNS_TXT, 'NS' => DNS_NS, 'SOA' => DNS_SOA,
            'CAA' => defined('DNS_CAA') ? constant('DNS_CAA') : throw new InvalidArgumentException('CAA lookup is not supported by this runtime.'),
            default => throw new InvalidArgumentException('Unsupported DNS record type.'),
        };
        $started = hrtime(true);
        $previousTimeout = ini_get('default_socket_timeout');
        ini_set('default_socket_timeout', (string) config('network.socket_timeout_seconds'));
        $raw = @dns_get_record($hostname, $constant);
        ini_set('default_socket_timeout', (string) $previousTimeout);
        if ($raw === false) {
            throw new InvalidArgumentException('DNS resolution failed.');
        }
        $records = array_map(fn (array $record): array => [
            'type' => $type,
            'value' => $record['ip'] ?? $record['ipv6'] ?? $record['target'] ?? $record['txt'] ?? $record['mname'] ?? (($record['flags'] ?? '').' '.($record['tag'] ?? '').' '.($record['value'] ?? '')),
            'ttl' => $record['ttl'] ?? null,
            'priority' => $record['pri'] ?? null,
            'details' => $type === 'SOA' ? array_intersect_key($record, array_flip(['mname', 'rname', 'serial', 'refresh', 'retry', 'expire', 'minimum-ttl'])) : null,
        ], array_slice($raw, 0, 100));

        return ['hostname' => $hostname, 'record_type' => $type, 'records' => $records, 'lookup_duration_ms' => round((hrtime(true) - $started) / 1_000_000, 2), 'provider' => 'system-resolver', 'source' => null, 'retrieved_at' => now()->toIso8601String()];
    }

    private function normalizeDnsName(string $hostname): string
    {
        if (! str_contains($hostname, '_')) {
            return $this->hostnames->normalize($hostname);
        }
        $hostname = strtolower(rtrim(trim($hostname), '.'));
        if (strlen($hostname) > 253 || ! preg_match('/^(?=.{1,253}$)(?:[a-z0-9_](?:[a-z0-9_-]{0,61}[a-z0-9_])?\.)+[a-z]{2,63}$/', $hostname)) {
            throw new InvalidArgumentException('Enter a valid DNS name.');
        }

        return $hostname;
    }
}
