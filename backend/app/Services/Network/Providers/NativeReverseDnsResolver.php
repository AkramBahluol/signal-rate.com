<?php

namespace App\Services\Network\Providers;

use App\Services\Network\Contracts\ReverseDnsResolver;
use App\Services\Network\NetworkAddress;
use App\Services\Network\ProviderResult;

final class NativeReverseDnsResolver implements ReverseDnsResolver
{
    public function __construct(private readonly NetworkAddress $addresses) {}

    public function lookup(string $ip): ProviderResult
    {
        $ip = $this->addresses->normalize($ip);
        $started = hrtime(true);
        $previousTimeout = ini_get('default_socket_timeout');
        ini_set('default_socket_timeout', (string) config('network.socket_timeout_seconds'));
        $hostname = @gethostbyaddr($ip);
        ini_set('default_socket_timeout', (string) $previousTimeout);
        $duration = round((hrtime(true) - $started) / 1_000_000, 2);

        return ProviderResult::success('system-resolver', null, ['hostnames' => $hostname && $hostname !== $ip ? [$hostname] : [], 'lookup_duration_ms' => $duration]);
    }
}
