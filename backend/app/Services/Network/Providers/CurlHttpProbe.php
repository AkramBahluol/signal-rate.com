<?php

namespace App\Services\Network\Providers;

use App\Services\Network\Contracts\HttpProbe;
use InvalidArgumentException;

final class CurlHttpProbe implements HttpProbe
{
    public function request(array $target): array
    {
        $pinnedIp = str_contains($target['ips'][0], ':') ? '['.$target['ips'][0].']' : $target['ips'][0];
        $headers = [];
        $status = 0;
        $location = null;
        $handle = curl_init($target['url']);
        curl_setopt_array($handle, [CURLOPT_NOBODY => true, CURLOPT_RETURNTRANSFER => true, CURLOPT_FOLLOWLOCATION => false, CURLOPT_CONNECTTIMEOUT => (int) config('network.socket_timeout_seconds'), CURLOPT_TIMEOUT => (int) config('network.provider_timeout_seconds'), CURLOPT_PROTOCOLS => CURLPROTO_HTTP | CURLPROTO_HTTPS, CURLOPT_RESOLVE => [$target['host'].':'.$target['port'].':'.$pinnedIp], CURLOPT_USERAGENT => 'SignalRate-Diagnostics/1.0', CURLOPT_HEADERFUNCTION => function ($curl, string $line) use (&$headers, &$status, &$location): int {
            if (preg_match('#^HTTP/\S+\s+(\d+)#i', $line, $m)) {
                $status = (int) $m[1];
                $headers = [];
                $location = null;
            } elseif (str_contains($line, ':')) {
                [$name,$value] = array_map('trim', explode(':', $line, 2));
                $headers[strtolower($name)] = $value;
                if (strtolower($name) === 'location') {
                    $location = $value;
                }
            }

            return strlen($line);
        }]);
        $started = microtime(true);
        $ok = curl_exec($handle);
        $responseTime = (int) round((microtime(true) - $started) * 1000);
        $error = curl_error($handle);
        curl_close($handle);
        if ($ok === false || $status === 0) {
            throw new InvalidArgumentException('HTTP request failed: '.($error ?: 'no response received.'));
        }

        return ['status' => $status, 'headers' => $headers, 'location' => $location, 'response_time_ms' => $responseTime];
    }
}
