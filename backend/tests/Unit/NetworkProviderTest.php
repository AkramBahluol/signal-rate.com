<?php

namespace Tests\Unit;

use App\Services\Network\Contracts\AsnProvider;
use App\Services\Network\Contracts\DnsResolver;
use App\Services\Network\Contracts\GeoIpProvider;
use App\Services\Network\Contracts\RdapProvider;
use App\Services\Network\Contracts\ReverseDnsResolver;
use App\Services\Network\DnsLookupService;
use App\Services\Network\HostnameValidator;
use App\Services\Network\NetworkAddress;
use App\Services\Network\NetworkLookupService;
use App\Services\Network\PortChecker;
use App\Services\Network\ProviderResult;
use Illuminate\Support\Facades\Cache;
use InvalidArgumentException;
use Tests\TestCase;

final class NetworkProviderTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        config(['cache.default' => 'array']);
        Cache::flush();
    }

    public function test_ip_provider_results_are_cached_by_address(): void
    {
        $geo = new class implements GeoIpProvider
        {
            public int $calls = 0;

            public function lookup(string $ip): ProviderResult
            {
                $this->calls++;

                return ProviderResult::success('fixture-geo', 'fixture://geo', ['country' => 'GB']);
            }
        };
        $asn = new class implements AsnProvider
        {
            public int $calls = 0;

            public function lookupIp(string $ip): ProviderResult
            {
                $this->calls++;

                return ProviderResult::success('fixture-asn', 'fixture://asn', ['asn' => 'AS64500']);
            }

            public function lookupAsn(int $asn): ProviderResult
            {
                return ProviderResult::unavailable('fixture-asn');
            }
        };
        $rdap = new class implements RdapProvider
        {
            public int $calls = 0;

            public function lookup(string $ip): ProviderResult
            {
                $this->calls++;

                return ProviderResult::success('fixture-rdap', 'fixture://rdap', []);
            }
        };
        $reverse = new class implements ReverseDnsResolver
        {
            public int $calls = 0;

            public function lookup(string $ip): ProviderResult
            {
                $this->calls++;

                return ProviderResult::success('fixture-ptr', null, ['hostnames' => ['fixture.example']]);
            }
        };
        $service = new NetworkLookupService(new NetworkAddress, $geo, $asn, $rdap, $reverse);
        $first = $service->lookup('8.8.8.8');
        $second = $service->lookup('8.8.8.8');

        $this->assertSame('GB', $first['geolocation']['data']['country']);
        $this->assertSame($first, $second);
        $this->assertSame(1, $geo->calls);
        $this->assertSame(1, $asn->calls);
        $this->assertSame(1, $rdap->calls);
        $this->assertSame(1, $reverse->calls);
    }

    public function test_provider_failure_is_normalized_without_guessed_data(): void
    {
        $geo = new class implements GeoIpProvider
        {
            public function lookup(string $ip): ProviderResult
            {
                throw new \RuntimeException('timeout with sensitive detail');
            }
        };
        $asn = new class implements AsnProvider
        {
            public function lookupIp(string $ip): ProviderResult
            {
                return ProviderResult::unavailable('asn');
            }

            public function lookupAsn(int $asn): ProviderResult
            {
                return ProviderResult::unavailable('asn');
            }
        };
        $rdap = new class implements RdapProvider
        {
            public function lookup(string $ip): ProviderResult
            {
                return ProviderResult::unavailable('rdap');
            }
        };
        $reverse = new class implements ReverseDnsResolver
        {
            public function lookup(string $ip): ProviderResult
            {
                return ProviderResult::unavailable('ptr');
            }
        };
        $result = (new NetworkLookupService(new NetworkAddress, $geo, $asn, $rdap, $reverse))->lookup('1.1.1.1');

        $this->assertSame('error', $result['geolocation']['status']);
        $this->assertSame([], $result['geolocation']['data']);
        $this->assertSame('Provider lookup failed or timed out.', $result['geolocation']['error']);
    }

    public function test_dns_cache_uses_record_ttl(): void
    {
        $resolver = new class implements DnsResolver
        {
            public int $calls = 0;

            public function lookup(string $hostname, string $type): array
            {
                $this->calls++;

                return ['hostname' => $hostname, 'record_type' => $type, 'records' => [['type' => $type, 'value' => '8.8.8.8', 'ttl' => 120]], 'provider' => 'fixture', 'retrieved_at' => now()->toIso8601String()];
            }
        };
        $service = new DnsLookupService($resolver, new HostnameValidator);
        $first = $service->lookup('example.com', 'A');
        $service->lookup('example.com', 'A');

        $this->assertSame(120, $first['cache_ttl_seconds']);
        $this->assertSame(1, $resolver->calls);
    }

    public function test_port_checker_blocks_dns_rebinding(): void
    {
        $resolver = new class implements DnsResolver
        {
            private int $aCalls = 0;

            public function lookup(string $hostname, string $type): array
            {
                if ($type === 'AAAA') {
                    return ['records' => []];
                }
                $this->aCalls++;

                return ['records' => [['value' => $this->aCalls === 1 ? '8.8.8.8' : '1.1.1.1']]];
            }
        };
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('changed during validation');
        (new PortChecker(new NetworkAddress, new HostnameValidator, $resolver))->check('example.com', 443);
    }
}
