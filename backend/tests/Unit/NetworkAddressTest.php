<?php

namespace Tests\Unit;

use App\Services\Network\Asn;
use App\Services\Network\HostnameValidator;
use App\Services\Network\NetworkAddress;
use InvalidArgumentException;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

final class NetworkAddressTest extends TestCase
{
    #[DataProvider('validAddresses')]
    public function test_it_validates_and_normalizes_ip_addresses(string $input, string $normalized, int $version): void
    {
        $addresses = new NetworkAddress;
        $this->assertSame($normalized, $addresses->normalize($input));
        $this->assertSame($version, $addresses->version($input));
    }

    public static function validAddresses(): array
    {
        return [['8.8.8.8', '8.8.8.8', 4], ['2001:4860:4860::8888', '2001:4860:4860::8888', 6]];
    }

    public function test_it_rejects_invalid_ip_addresses(): void
    {
        $this->expectException(InvalidArgumentException::class);
        (new NetworkAddress)->normalize('999.1.1.1');
    }

    public function test_it_classifies_public_and_special_addresses(): void
    {
        $addresses = new NetworkAddress;
        $this->assertTrue($addresses->classification('8.8.8.8')['public']);
        $this->assertTrue($addresses->classification('10.2.3.4')['private']);
        $this->assertTrue($addresses->classification('127.0.0.1')['loopback']);
        $this->assertTrue($addresses->classification('169.254.10.2')['link_local']);
        $this->assertTrue($addresses->classification('224.0.0.1')['multicast']);
        $this->assertTrue($addresses->classification('2001:db8::1')['documentation']);
        $this->assertSame('2001:0db8:0000:0000:0000:0000:0000:0001', $addresses->classification('2001:db8::1')['expanded']);
        $this->assertTrue($addresses->isCloudMetadata('169.254.169.254'));
    }

    public function test_asn_and_hostname_normalization(): void
    {
        $this->assertSame(15169, (new Asn)->normalize('AS15169'));
        $this->assertSame(15169, (new Asn)->normalize('15169'));
        $this->assertSame('example.com', (new HostnameValidator)->normalize('Example.COM.'));
    }

    public function test_hostname_rejects_urls_and_internal_names(): void
    {
        foreach (['https://example.com', 'localhost', 'service.internal'] as $invalid) {
            try {
                (new HostnameValidator)->normalize($invalid);
                $this->fail("{$invalid} should be rejected.");
            } catch (InvalidArgumentException) {
                $this->addToAssertionCount(1);
            }
        }
    }
}
