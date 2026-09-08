<?php

namespace Tests\Unit;

use App\Services\Network\NetworkAddress;
use App\Services\Network\SubnetCalculator;
use InvalidArgumentException;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

final class SubnetCalculatorTest extends TestCase
{
    #[DataProvider('cidrCases')]
    public function test_ipv4_cidr_boundaries(int $prefix, string $network, string $broadcast, int|float $total): void
    {
        $result = (new SubnetCalculator(new NetworkAddress))->calculate('192.168.1.129', $prefix);
        $this->assertSame($network, $result['network_address']);
        $this->assertSame($broadcast, $result['broadcast_address']);
        $this->assertEquals($total, $result['total_addresses']);
    }

    public static function cidrCases(): array
    {
        return [
            'slash 0' => [0, '0.0.0.0', '255.255.255.255', 4294967296],
            'slash 8' => [8, '192.0.0.0', '192.255.255.255', 16777216],
            'slash 16' => [16, '192.168.0.0', '192.168.255.255', 65536],
            'slash 24' => [24, '192.168.1.0', '192.168.1.255', 256],
            'slash 30' => [30, '192.168.1.128', '192.168.1.131', 4],
            'slash 31' => [31, '192.168.1.128', '192.168.1.129', 2],
            'slash 32' => [32, '192.168.1.129', '192.168.1.129', 1],
        ];
    }

    public function test_slash_31_and_32_host_semantics(): void
    {
        $calculator = new SubnetCalculator(new NetworkAddress);
        $this->assertSame(2, $calculator->calculate('10.0.0.0', 31)['usable_hosts']);
        $this->assertSame(1, $calculator->calculate('10.0.0.1', 32)['usable_hosts']);
        $this->assertSame(24, $calculator->netmaskToCidr('255.255.255.0'));
    }

    public function test_non_contiguous_netmask_is_rejected(): void
    {
        $this->expectException(InvalidArgumentException::class);
        (new SubnetCalculator(new NetworkAddress))->netmaskToCidr('255.0.255.0');
    }
}
