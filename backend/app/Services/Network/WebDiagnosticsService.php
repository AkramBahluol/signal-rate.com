<?php

namespace App\Services\Network;

use App\Services\Network\Contracts\HttpProbe;
use InvalidArgumentException;

final class WebDiagnosticsService
{
    public function __construct(private readonly PublicUrlGuard $guard, private readonly HttpProbe $http) {}

    public function redirects(string $url): array
    {
        $hops = [];
        for ($i = 0; $i < 6; $i++) {
            $target = $this->guard->validate($url);
            $response = $this->http->request($target);
            $hops[] = ['url' => $target['url'], 'status' => $response['status'], 'location' => $response['location']];
            if ($response['location'] === null || $response['status'] < 300 || $response['status'] >= 400) {
                return ['hops' => $hops, 'final_url' => $target['url'], 'redirect_count' => count($hops) - 1, 'checked_at' => now()->toIso8601String()];
            }
            $url = $this->absolute($target['url'], $response['location']);
        }
        throw new InvalidArgumentException('Redirect limit exceeded (maximum 5 redirects).');
    }

    public function headers(string $url): array
    {
        $target = $this->guard->validate($url);
        $response = $this->http->request($target);
        $headers = $response['headers'];
        $security = [];
        foreach (['strict-transport-security', 'content-security-policy', 'x-content-type-options', 'referrer-policy', 'permissions-policy'] as $name) {
            $security[$name] = array_key_exists($name, $headers);
        }

        return ['url' => $target['url'], 'status' => $response['status'], 'headers' => $headers, 'security_headers_present' => $security, 'checked_at' => now()->toIso8601String()];
    }

    public function certificate(string $hostname): array
    {
        $target = $this->guard->validate('https://'.trim($hostname).'/');
        $ip = $target['ips'][0];
        $context = stream_context_create(['ssl' => ['capture_peer_cert' => true, 'verify_peer' => true, 'verify_peer_name' => true, 'peer_name' => $target['host'], 'SNI_enabled' => true]]);
        $endpoint = str_contains($ip, ':') ? "ssl://[{$ip}]:443" : "ssl://{$ip}:443";
        $socket = @stream_socket_client($endpoint, $code, $message, (float) config('network.socket_timeout_seconds'), STREAM_CLIENT_CONNECT, $context);
        if (! is_resource($socket)) {
            throw new InvalidArgumentException('TLS connection failed: '.($message ?: 'certificate could not be verified.'));
        }
        $params = stream_context_get_params($socket);
        $crypto = stream_get_meta_data($socket)['crypto'] ?? [];
        fclose($socket);
        $parsed = openssl_x509_parse($params['options']['ssl']['peer_certificate'] ?? null);
        if (! is_array($parsed)) {
            throw new InvalidArgumentException('The server certificate could not be parsed.');
        }
        $expires = (int) ($parsed['validTo_time_t'] ?? 0);

        return ['hostname' => $target['host'], 'subject' => $parsed['subject']['CN'] ?? null, 'issuer' => $parsed['issuer']['CN'] ?? null, 'tls_protocol' => $crypto['protocol'] ?? null, 'cipher' => $crypto['cipher_name'] ?? null, 'valid_from' => isset($parsed['validFrom_time_t']) ? date(DATE_ATOM, $parsed['validFrom_time_t']) : null, 'valid_to' => $expires ? date(DATE_ATOM, $expires) : null, 'days_remaining' => $expires ? (int) floor(($expires - time()) / 86400) : null, 'subject_alt_names' => isset($parsed['extensions']['subjectAltName']) ? explode(', ', $parsed['extensions']['subjectAltName']) : [], 'checked_at' => now()->toIso8601String()];
    }

    private function absolute(string $base, string $location): string
    {
        if (preg_match('#^https?://#i', $location)) {
            return $location;
        }
        $parts = parse_url($base);
        $origin = $parts['scheme'].'://'.$parts['host'].(isset($parts['port']) ? ':'.$parts['port'] : '');
        if (str_starts_with($location, '//')) {
            return $parts['scheme'].':'.$location;
        }
        if (str_starts_with($location, '/')) {
            return $origin.$location;
        }
        $path = $parts['path'] ?? '/';

        return $origin.rtrim(str_replace('\\', '/', dirname($path)), '/').'/'.$location;
    }
}
