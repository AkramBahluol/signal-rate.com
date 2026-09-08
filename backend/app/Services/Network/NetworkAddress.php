<?php

namespace App\Services\Network;

use InvalidArgumentException;

final class NetworkAddress
{
    public function normalize(string $ip): string
    {
        $ip = trim($ip);
        if (filter_var($ip, FILTER_VALIDATE_IP) === false) {
            throw new InvalidArgumentException('Enter a valid IPv4 or IPv6 address.');
        }

        return inet_ntop(inet_pton($ip));
    }

    public function version(string $ip): int
    {
        $normalized = $this->normalize($ip);

        return filter_var($normalized, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4) ? 4 : 6;
    }

    public function isPublic(string $ip): bool
    {
        $normalized = $this->normalize($ip);

        return filter_var($normalized, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) !== false
            && ! $this->isCloudMetadata($normalized);
    }

    public function isCloudMetadata(string $ip): bool
    {
        $normalized = $this->normalize($ip);

        return $normalized === '169.254.169.254' || $normalized === '100.100.100.200' || $normalized === 'fd00:ec2::254';
    }

    public function classification(string $ip): array
    {
        $ip = $this->normalize($ip);
        $version = $this->version($ip);
        $flags = [
            'private' => $this->inAny($ip, $version === 4 ? ['10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16'] : ['fc00::/7']),
            'loopback' => $this->inAny($ip, $version === 4 ? ['127.0.0.0/8'] : ['::1/128']),
            'link_local' => $this->inAny($ip, $version === 4 ? ['169.254.0.0/16'] : ['fe80::/10']),
            'multicast' => $this->inAny($ip, $version === 4 ? ['224.0.0.0/4'] : ['ff00::/8']),
            'unspecified' => in_array($ip, ['0.0.0.0', '::'], true),
            'documentation' => $this->inAny($ip, $version === 4 ? ['192.0.2.0/24', '198.51.100.0/24', '203.0.113.0/24'] : ['2001:db8::/32']),
        ];

        return [
            'ip' => $ip,
            'version' => $version,
            'compressed' => $ip,
            'expanded' => $version === 6 ? $this->expandIpv6($ip) : $ip,
            ...$flags,
            'public' => $this->isPublic($ip),
            'reserved_or_special' => ! $this->isPublic($ip) && ! $flags['private'] && ! $flags['loopback'] && ! $flags['link_local'],
        ];
    }

    public function contains(string $cidr, string $ip): bool
    {
        [$network, $prefix] = $this->parseCidr($cidr);
        $ip = $this->normalize($ip);
        if ($this->version($network) !== $this->version($ip)) {
            return false;
        }
        $networkBytes = inet_pton($network);
        $ipBytes = inet_pton($ip);
        $fullBytes = intdiv($prefix, 8);
        $remainingBits = $prefix % 8;
        if (substr($networkBytes, 0, $fullBytes) !== substr($ipBytes, 0, $fullBytes)) {
            return false;
        }
        if ($remainingBits === 0) {
            return true;
        }
        $mask = (0xFF << (8 - $remainingBits)) & 0xFF;

        return (ord($networkBytes[$fullBytes]) & $mask) === (ord($ipBytes[$fullBytes]) & $mask);
    }

    public function parseCidr(string $cidr): array
    {
        $parts = explode('/', trim($cidr));
        if (count($parts) !== 2 || ! ctype_digit($parts[1])) {
            throw new InvalidArgumentException('Enter CIDR in address/prefix format.');
        }
        $ip = $this->normalize($parts[0]);
        $prefix = (int) $parts[1];
        $max = $this->version($ip) === 4 ? 32 : 128;
        if ($prefix < 0 || $prefix > $max) {
            throw new InvalidArgumentException("CIDR prefix must be between 0 and {$max}.");
        }

        return [$ip, $prefix];
    }

    private function inAny(string $ip, array $ranges): bool
    {
        foreach ($ranges as $range) {
            if ($this->contains($range, $ip)) {
                return true;
            }
        }

        return false;
    }

    private function expandIpv6(string $ip): string
    {
        return implode(':', str_split(bin2hex(inet_pton($ip)), 4));
    }
}
