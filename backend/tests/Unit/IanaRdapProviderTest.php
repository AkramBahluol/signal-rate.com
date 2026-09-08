<?php

namespace Tests\Unit;

use App\Services\Network\NetworkAddress;
use App\Services\Network\Providers\IanaRdapProvider;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

final class IanaRdapProviderTest extends TestCase
{
    public function test_it_uses_iana_bootstrap_and_normalizes_rir_data(): void
    {
        config(['cache.default' => 'array']);
        Cache::flush();
        Http::preventStrayRequests();
        Http::fake([
            'https://data.iana.org/rdap/ipv4.json' => Http::response(['services' => [[['8.0.0.0/8'], ['https://rdap.arin.net/registry']]]]),
            'https://rdap.arin.net/registry/ip/8.8.8.8' => Http::response(['name' => 'FIXTURE-NET', 'handle' => 'NET-8-0-0-0-1', 'startAddress' => '8.0.0.0', 'endAddress' => '8.255.255.255', 'country' => 'US', 'cidr0_cidrs' => [['v4prefix' => '8.0.0.0', 'length' => 8]]]),
        ]);

        $result = (new IanaRdapProvider(new NetworkAddress))->lookup('8.8.8.8');
        $this->assertSame('success', $result->status);
        $this->assertSame('ARIN', $result->provider);
        $this->assertSame('FIXTURE-NET', $result->data['network_name']);
        $this->assertSame(['8.0.0.0/8'], $result->data['cidrs']);
    }
}
