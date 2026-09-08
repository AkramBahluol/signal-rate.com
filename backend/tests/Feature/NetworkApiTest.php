<?php

namespace Tests\Feature;

use App\Services\Network\Contracts\AsnProvider;
use App\Services\Network\Contracts\DnsResolver;
use App\Services\Network\Contracts\GeoIpProvider;
use App\Services\Network\Contracts\HttpProbe;
use App\Services\Network\Contracts\RdapProvider;
use App\Services\Network\Contracts\ReverseDnsResolver;
use App\Services\Network\ProviderResult;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Routing\Middleware\ThrottleRequests;
use InvalidArgumentException;
use Tests\TestCase;

final class NetworkApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutMiddleware(ThrottleRequests::class);
        $this->app->bind(GeoIpProvider::class, fn () => new class implements GeoIpProvider
        {
            public function lookup(string $ip): ProviderResult
            {
                return ProviderResult::unavailable('fixture-geo');
            }
        });
        $this->app->bind(AsnProvider::class, fn () => new class implements AsnProvider
        {
            public function lookupIp(string $ip): ProviderResult
            {
                return ProviderResult::unavailable('fixture-asn');
            }

            public function lookupAsn(int $asn): ProviderResult
            {
                return ProviderResult::success('fixture-asn', 'fixture://asn', ['organization' => 'Fixture only']);
            }
        });
        $this->app->bind(RdapProvider::class, fn () => new class implements RdapProvider
        {
            public function lookup(string $ip): ProviderResult
            {
                return ProviderResult::unavailable('fixture-rdap');
            }
        });
        $this->app->bind(ReverseDnsResolver::class, fn () => new class implements ReverseDnsResolver
        {
            public function lookup(string $ip): ProviderResult
            {
                return ProviderResult::success('fixture-dns', null, ['hostnames' => []]);
            }
        });
        $this->app->bind(DnsResolver::class, fn () => new class implements DnsResolver
        {
            public function lookup(string $hostname, string $type): array
            {
                $value = match (true) {
                    $type === 'A' => '203.0.113.10', $type === 'AAAA' => '2001:db8::10', $type === 'CNAME' => 'canonical.example.com',
                    $type === 'TXT' && $hostname === '_dmarc.example.com' => 'v=DMARC1; p=reject; rua=mailto:dmarc@example.com',
                    $type === 'TXT' && $hostname === 'default._domainkey.example.com' => 'v=DKIM1; k=rsa; p=fixture-public-key',
                    $type === 'TXT' => 'v=spf1 include:_spf.example.com -all', default => 'mail.example.com',
                };

                return ['hostname' => $hostname, 'record_type' => $type, 'records' => [['type' => $type, 'value' => $value, 'ttl' => 300, 'priority' => $type === 'MX' ? 10 : null]], 'provider' => 'fixture-dns', 'retrieved_at' => now()->toIso8601String()];
            }
        });
    }

    public function test_ip_and_asn_endpoints_validate_and_normalize(): void
    {
        $this->getJson('/api/v1/network/ip/2001:4860:4860::8888')->assertOk()->assertJsonPath('data.version', 6);
        $this->getJson('/api/v1/network/ip/not-an-ip')->assertUnprocessable();
        $this->getJson('/api/v1/network/asn/AS15169')->assertOk()->assertJsonPath('data.asn', 'AS15169');
        $this->getJson('/api/v1/network/asn/AS0')->assertUnprocessable();
    }

    public function test_client_ip_does_not_blindly_trust_forwarded_header(): void
    {
        $this->withServerVariables(['REMOTE_ADDR' => '127.0.0.1'])->withHeader('X-Forwarded-For', '8.8.8.8')->getJson('/api/v1/network/my-ip')
            ->assertOk()->assertJsonPath('data.ip', '127.0.0.1')->assertJsonPath('data.classification.loopback', true);
    }

    public function test_subnet_cidr_and_classification_apis(): void
    {
        $this->postJson('/api/v1/network/subnet/calculate', ['ip' => '192.168.1.10', 'cidr' => 31])->assertOk()->assertJsonPath('data.usable_hosts', 2);
        $this->postJson('/api/v1/network/cidr/calculate', ['netmask' => '255.255.255.0'])->assertOk()->assertJsonPath('data.cidr', 24);
        $this->postJson('/api/v1/network/ip/calculate', ['ip' => 'fc00::1'])->assertOk()->assertJsonPath('data.private', true);
    }

    public function test_dns_reverse_and_port_inputs_are_restricted(): void
    {
        $this->getJson('/api/v1/network/dns?hostname=https://example.com&type=A')->assertUnprocessable();
        $this->getJson('/api/v1/network/dns?hostname=example.com&type=ANY')->assertUnprocessable();
        $this->getJson('/api/v1/network/reverse-dns/not-an-ip')->assertUnprocessable();
        $this->postJson('/api/v1/network/port-check', ['host' => '127.0.0.1', 'port' => 80])->assertUnprocessable();
        $this->postJson('/api/v1/network/port-check', ['host' => '169.254.169.254', 'port' => 80])->assertUnprocessable()->assertJsonFragment(['message' => 'Cloud metadata addresses are blocked.']);
        $this->postJson('/api/v1/network/port-check', ['host' => '172.19.0.1', 'port' => 80])->assertUnprocessable();
        $this->postJson('/api/v1/network/port-check', ['host' => '8.8.8.8', 'port' => 70000])->assertUnprocessable();
    }

    public function test_blacklist_empty_registry_is_honest(): void
    {
        $this->postJson('/api/v1/network/blacklist/check', ['ip' => '8.8.8.8'])->assertOk()->assertJsonPath('data.checked_count', 0)->assertJsonPath('data.listed_count', 0)->assertJsonPath('data.summary', 'No license-approved blacklist providers are enabled.');
        $this->postJson('/api/v1/network/blacklist/check', ['ip' => '10.0.0.1'])->assertUnprocessable();
    }

    public function test_dns_hostname_reverse_and_rdap_endpoints_return_normalized_shapes(): void
    {
        $this->getJson('/api/v1/network/hostname?hostname=example.com')->assertOk()->assertJsonPath('data.ipv4.0', '203.0.113.10')->assertJsonPath('data.canonical_names.0', 'canonical.example.com');
        $this->getJson('/api/v1/network/dns?hostname=example.com&type=MX')->assertOk()->assertJsonPath('data.records.0.priority', 10);
        $this->getJson('/api/v1/network/reverse-dns/8.8.8.8')->assertOk()->assertJsonPath('data.status', 'success');
        $this->getJson('/api/v1/network/rdap/8.8.8.8')->assertOk()->assertJsonPath('data.status', 'unavailable');
    }

    public function test_global_search_includes_network_tools(): void
    {
        $this->getJson('/api/v1/search?q=what%20is%20my%20ip')->assertOk()->assertJsonFragment(['title' => 'What Is My IP']);
        $this->getJson('/api/v1/search?q=cidr')->assertOk()->assertJsonFragment(['title' => 'CIDR Calculator']);
        $this->getJson('/api/v1/search?q=port%20checker')->assertOk()->assertJsonFragment(['title' => 'Port Checker']);
        $this->getJson('/api/v1/search?q=email%20security')->assertOk()->assertJsonFragment(['title' => 'Email Security']);
        $this->getJson('/api/v1/search?q=tls%20certificate')->assertOk()->assertJsonFragment(['title' => 'SSL Certificate Checker']);
        $this->getJson('/api/v1/search?q=download%20time')->assertOk()->assertJsonFragment(['title' => 'Download Time Calculator']);
        $this->getJson('/api/v1/search?q=internet%20speed')->assertOk()->assertJsonFragment(['title' => 'Internet Speed Test', 'url' => '/network/speed-test']);
        $this->getJson('/api/v1/search?q=regex')->assertOk()->assertJsonFragment(['title' => 'Regex Tester']);
    }

    public function test_email_security_endpoints_parse_observed_dns_policies(): void
    {
        $this->getJson('/api/v1/network/email/spf?domain=example.com')->assertOk()->assertJsonPath('data.status', 'found')->assertJsonPath('data.mechanisms.1', '-all');
        $this->getJson('/api/v1/network/email/dmarc?domain=example.com')->assertOk()->assertJsonPath('data.tags.p', 'reject');
        $this->getJson('/api/v1/network/email/dkim?domain=example.com&selector=default')->assertOk()->assertJsonPath('data.status', 'found');
        $this->getJson('/api/v1/network/email/dkim?domain=example.com&selector=bad.selector')->assertUnprocessable();
    }

    public function test_web_diagnostics_block_private_metadata_and_non_http_targets(): void
    {
        $this->postJson('/api/v1/network/redirect-check', ['url' => 'http://127.0.0.1/admin'])->assertUnprocessable();
        $this->postJson('/api/v1/network/http-headers', ['url' => 'http://169.254.169.254/latest/meta-data'])->assertUnprocessable();
        $this->postJson('/api/v1/network/redirect-check', ['url' => 'file:///etc/passwd'])->assertUnprocessable();
        $this->postJson('/api/v1/network/ssl-certificate', ['hostname' => 'localhost'])->assertUnprocessable();
        $this->postJson('/api/v1/network/availability', ['target' => 'http://127.0.0.1/'])->assertUnprocessable();
        $this->postJson('/api/v1/network/https-health', ['target' => 'http://169.254.169.254/'])->assertUnprocessable();
        $this->postJson('/api/v1/network/tls-versions', ['target' => 'localhost'])->assertUnprocessable();
        $this->postJson('/api/v1/network/availability', ['target' => 'https://example.com:8443/'])->assertUnprocessable();
    }

    public function test_redirect_headers_limit_and_timeout_use_deterministic_probes(): void
    {
        $this->app->bind(DnsResolver::class, fn () => new class implements DnsResolver
        {
            public function lookup(string $hostname, string $type): array
            {
                return ['hostname' => $hostname, 'record_type' => $type, 'records' => $type === 'A' ? [['value' => '8.8.8.8', 'ttl' => 60]] : []];
            }
        });
        $this->app->bind(HttpProbe::class, fn () => new class implements HttpProbe
        {
            public function request(array $target): array
            {
                if (str_contains($target['url'], 'timeout')) {
                    throw new InvalidArgumentException('HTTP request failed: operation timed out.');
                }
                if (str_contains($target['url'], '/loop')) {
                    return ['status' => 301, 'headers' => [], 'location' => '/loop'];
                }
                if (str_contains($target['url'], 'start.example')) {
                    return ['status' => 302, 'headers' => ['location' => 'https://final.example/'], 'location' => 'https://final.example/'];
                }

                return ['status' => 200, 'headers' => ['content-type' => 'text/html', 'content-security-policy' => "default-src 'self'"], 'location' => null];
            }
        });
        $this->postJson('/api/v1/network/redirect-check', ['url' => 'https://start.example/'])->assertOk()->assertJsonPath('data.redirect_count', 1)->assertJsonPath('data.final_url', 'https://final.example/');
        $this->postJson('/api/v1/network/http-headers', ['url' => 'https://final.example/'])->assertOk()->assertJsonPath('data.security_headers_present.content-security-policy', true);
        $this->postJson('/api/v1/network/redirect-check', ['url' => 'https://loop.example/loop'])->assertUnprocessable()->assertJsonFragment(['message' => 'Redirect limit exceeded (maximum 5 redirects).']);
        $this->postJson('/api/v1/network/http-headers', ['url' => 'https://timeout.example/'])->assertUnprocessable()->assertJsonFragment(['message' => 'HTTP request failed: operation timed out.']);
    }

    public function test_web_diagnostics_block_dns_rebinding_before_http_probe(): void
    {
        $this->app->bind(DnsResolver::class, fn () => new class implements DnsResolver
        {
            private int $lookups = 0;

            public function lookup(string $hostname, string $type): array
            {
                $records = [];
                if ($type === 'A') {
                    $this->lookups++;
                    $records = [['value' => $this->lookups === 1 ? '8.8.8.8' : '1.1.1.1', 'ttl' => 60]];
                }

                return ['hostname' => $hostname, 'record_type' => $type, 'records' => $records];
            }
        });
        $this->app->bind(HttpProbe::class, fn () => new class implements HttpProbe
        {
            public function request(array $validatedTarget): array
            {
                throw new \RuntimeException('Probe must not run.');
            }
        });
        $this->postJson('/api/v1/network/http-headers', ['url' => 'https://rebind.example/'])->assertUnprocessable()->assertJsonFragment(['message' => 'Hostname addresses changed during validation; the request was blocked.']);
    }
}
