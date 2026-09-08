<?php

namespace App\Services\Network;

use InvalidArgumentException;

final class SubnetCalculator
{
    public function __construct(private readonly NetworkAddress $addresses) {}

    public function calculate(string $ip, int $prefix): array
    {
        $ip = $this->addresses->normalize($ip);
        if ($this->addresses->version($ip) !== 4 || $prefix < 0 || $prefix > 32) {
            throw new InvalidArgumentException('IPv4 CIDR prefix must be between 0 and 32.');
        }
        $value = (int) sprintf('%u', ip2long($ip));
        $mask = $prefix === 0 ? 0 : (0xFFFFFFFF << (32 - $prefix)) & 0xFFFFFFFF;
        $network = $value & $mask;
        $broadcast = $network | (~$mask & 0xFFFFFFFF);
        $total = 2 ** (32 - $prefix);
        $usable = $prefix >= 31 ? $total : max(0, $total - 2);
        $first = $prefix >= 31 ? $network : $network + 1;
        $last = $prefix >= 31 ? $broadcast : $broadcast - 1;

        return [
            'input' => "{$ip}/{$prefix}", 'cidr' => $prefix,
            'network_address' => long2ip($network), 'broadcast_address' => long2ip($broadcast),
            'subnet_mask' => long2ip($mask), 'wildcard_mask' => long2ip(~$mask & 0xFFFFFFFF),
            'first_usable' => long2ip($first), 'last_usable' => long2ip($last),
            'total_addresses' => $total, 'usable_hosts' => $usable,
            'host_semantics' => $prefix === 31 ? 'RFC 3021 point-to-point: both addresses are usable.' : ($prefix === 32 ? 'Single-host route: the one address is usable.' : 'Network and broadcast addresses are excluded from usable hosts.'),
        ];
    }

    public function netmaskToCidr(string $netmask): int
    {
        $netmask = $this->addresses->normalize($netmask);
        if ($this->addresses->version($netmask) !== 4) {
            throw new InvalidArgumentException('Enter a valid IPv4 subnet mask.');
        }
        $binary = str_pad(decbin((int) sprintf('%u', ip2long($netmask))), 32, '0', STR_PAD_LEFT);
        if (! preg_match('/^1*0*$/', $binary)) {
            throw new InvalidArgumentException('Subnet mask bits must be contiguous.');
        }

        return substr_count($binary, '1');
    }
}
