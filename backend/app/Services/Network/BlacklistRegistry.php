<?php

namespace App\Services\Network;

use App\Services\Network\Contracts\BlacklistProvider;

final class BlacklistRegistry
{
    public function __construct(private readonly NetworkAddress $addresses) {}

    public function check(string $ip): array
    {
        $ip = $this->addresses->normalize($ip);
        if (! $this->addresses->isPublic($ip)) {
            throw new \InvalidArgumentException('Blacklist checks only support public IP addresses.');
        }
        $results = [];
        foreach (config('network.blacklists', []) as $configuration) {
            if (! ($configuration['enabled'] ?? false)) {
                continue;
            }
            $provider = app($configuration['class']);
            if (! $provider instanceof BlacklistProvider) {
                continue;
            }
            try {
                $result = $provider->lookup($ip);
                $results[] = [...$result->toArray(), 'name' => $provider->name(), 'license_note' => $provider->licenseNote()];
            } catch (\Throwable) {
                $results[] = ProviderResult::failed($provider->name(), null, 'Provider failed or timed out.')->toArray();
            }
        }
        $listed = count(array_filter($results, fn ($result) => ($result['data']['listed'] ?? false) === true));
        $known = count(array_filter($results, fn ($result) => $result['status'] === 'success'));

        return ['ip' => $ip, 'checked_count' => count($results), 'listed_count' => $listed, 'not_listed_count' => $known - $listed, 'unknown_or_error_count' => count($results) - $known, 'results' => $results, 'checked_at' => now()->toIso8601String(), 'summary' => $results === [] ? 'No license-approved blacklist providers are enabled.' : ($listed ? 'Listed on one or more checked sources.' : 'Not listed on the checked sources.')];
    }
}
