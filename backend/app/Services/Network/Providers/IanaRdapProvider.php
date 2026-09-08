<?php

namespace App\Services\Network\Providers;

use App\Services\Network\Contracts\RdapProvider;
use App\Services\Network\NetworkAddress;
use App\Services\Network\ProviderResult;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use RuntimeException;

final class IanaRdapProvider implements RdapProvider
{
    private const RIR_HOSTS = ['rdap.arin.net', 'rdap.db.ripe.net', 'rdap.apnic.net', 'rdap.lacnic.net', 'rdap.afrinic.net'];

    public function __construct(private readonly NetworkAddress $addresses) {}

    public function lookup(string $ip): ProviderResult
    {
        $ip = $this->addresses->normalize($ip);
        if (! $this->addresses->isPublic($ip)) {
            return ProviderResult::unavailable('rdap', 'IANA RDAP bootstrap', 'RDAP is only queried for public addresses.');
        }

        try {
            $bootstrapUrl = $this->addresses->version($ip) === 4 ? 'https://data.iana.org/rdap/ipv4.json' : 'https://data.iana.org/rdap/ipv6.json';
            $bootstrap = Cache::remember('network:rdap:bootstrap:'.basename($bootstrapUrl), config('network.rdap_bootstrap_cache_seconds'), fn (): array => $this->fetchJson($bootstrapUrl));
            $baseUrl = $this->findService($bootstrap, $ip);
            $host = parse_url($baseUrl, PHP_URL_HOST);
            if (parse_url($baseUrl, PHP_URL_SCHEME) !== 'https' || ! in_array($host, self::RIR_HOSTS, true)) {
                throw new RuntimeException('RDAP bootstrap returned an unapproved registry endpoint.');
            }
            $source = rtrim($baseUrl, '/').'/ip/'.rawurlencode($ip);
            $raw = $this->fetchJson($source);

            return ProviderResult::success($this->rirName((string) $host), $source, $this->normalize($raw));
        } catch (\Throwable $exception) {
            return ProviderResult::failed('rdap', 'IANA RDAP bootstrap', 'Registry data is temporarily unavailable.');
        }
    }

    private function fetchJson(string $url): array
    {
        $response = Http::acceptJson()->timeout(config('network.provider_timeout_seconds'))->retry(1, 150)->get($url);
        if (! $response->successful() || strlen($response->body()) > config('network.max_provider_response_bytes')) {
            throw new RuntimeException('Invalid or oversized RDAP response.');
        }
        $data = $response->json();
        if (! is_array($data)) {
            throw new RuntimeException('RDAP response was not JSON.');
        }

        return $data;
    }

    private function findService(array $bootstrap, string $ip): string
    {
        foreach ($bootstrap['services'] ?? [] as $service) {
            foreach ($service[0] ?? [] as $range) {
                if ($this->addresses->contains($range, $ip)) {
                    return $service[1][0] ?? throw new RuntimeException('RDAP service URL is missing.');
                }
            }
        }

        throw new RuntimeException('No RDAP registry was found for the address.');
    }

    private function normalize(array $raw): array
    {
        $cidrs = [];
        foreach ($raw['cidr0_cidrs'] ?? [] as $cidr) {
            $length = $cidr['length'] ?? null;
            $prefix = $cidr['v4prefix'] ?? $cidr['v6prefix'] ?? null;
            if ($prefix !== null && $length !== null) {
                $cidrs[] = "{$prefix}/{$length}";
            }
        }

        return [
            'network_name' => $raw['name'] ?? null, 'handle' => $raw['handle'] ?? null,
            'start_address' => $raw['startAddress'] ?? null, 'end_address' => $raw['endAddress'] ?? null,
            'ip_version' => $raw['ipVersion'] ?? null, 'country' => $raw['country'] ?? null,
            'type' => $raw['type'] ?? null, 'parent_handle' => $raw['parentHandle'] ?? null,
            'cidrs' => array_slice($cidrs, 0, 100),
            'entities' => array_map(fn (array $entity): array => $this->normalizeEntity($entity), array_slice($raw['entities'] ?? [], 0, 30)),
            'events' => array_slice($raw['events'] ?? [], 0, 30),
            'remarks' => array_map(fn (array $remark): array => ['title' => $remark['title'] ?? null, 'description' => array_slice($remark['description'] ?? [], 0, 10)], array_slice($raw['remarks'] ?? [], 0, 30)),
        ];
    }

    private function normalizeEntity(array $entity): array
    {
        $fields = [];
        foreach (($entity['vcardArray'][1] ?? []) as $field) {
            if (isset($field[0], $field[3]) && in_array($field[0], ['fn', 'org', 'email'], true)) {
                $fields[$field[0]] = is_array($field[3]) ? implode(' ', $field[3]) : $field[3];
            }
        }

        return ['handle' => $entity['handle'] ?? null, 'roles' => $entity['roles'] ?? [], 'name' => $fields['fn'] ?? $fields['org'] ?? null, 'email' => $fields['email'] ?? null];
    }

    private function rirName(string $host): string
    {
        return match ($host) {
            'rdap.arin.net' => 'ARIN', 'rdap.db.ripe.net' => 'RIPE NCC', 'rdap.apnic.net' => 'APNIC',
            'rdap.lacnic.net' => 'LACNIC', 'rdap.afrinic.net' => 'AFRINIC', default => 'RDAP registry',
        };
    }
}
