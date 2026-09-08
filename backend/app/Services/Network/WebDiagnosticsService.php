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
            $hops[] = ['url' => $target['url'], 'status' => $response['status'], 'location' => $response['location'], 'response_time_ms' => $response['response_time_ms'] ?? null];
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
        $context = stream_context_create(['ssl' => ['capture_peer_cert' => true, 'capture_peer_cert_chain' => true, 'verify_peer' => true, 'verify_peer_name' => true, 'peer_name' => $target['host'], 'SNI_enabled' => true]]);
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

        return ['hostname' => $target['host'], 'valid' => true, 'hostname_match' => true, 'chain_verified' => true, 'subject' => $parsed['subject']['CN'] ?? null, 'issuer' => $parsed['issuer']['CN'] ?? null, 'tls_protocol' => $crypto['protocol'] ?? null, 'cipher' => $crypto['cipher_name'] ?? null, 'valid_from' => isset($parsed['validFrom_time_t']) ? date(DATE_ATOM, $parsed['validFrom_time_t']) : null, 'valid_to' => $expires ? date(DATE_ATOM, $expires) : null, 'days_remaining' => $expires ? (int) floor(($expires - time()) / 86400) : null, 'subject_alt_names' => isset($parsed['extensions']['subjectAltName']) ? explode(', ', $parsed['extensions']['subjectAltName']) : [], 'checked_at' => now()->toIso8601String()];
    }

    public function availability(string $input): array
    {
        $url = $this->normalUrl($input, 'https');
        $result = $this->redirects($url);
        $last = $result['hops'][array_key_last($result['hops'])];
        $tls = null;
        if (str_starts_with($result['final_url'], 'https://')) {
            try {
                $tls = $this->certificate((string) parse_url($result['final_url'], PHP_URL_HOST));
            } catch (\Throwable) {
                $tls = ['valid' => false];
            }
        }

        return ['website' => $input, 'dns' => 'working', 'reachable_from_signalrate' => true, 'https_available' => str_starts_with($result['final_url'], 'https://'), 'http_status' => $last['status'], 'response_time_ms' => $last['response_time_ms'], 'final_url' => $result['final_url'], 'redirect_count' => $result['redirect_count'], 'certificate_valid' => $tls['valid'] ?? null, 'checked_at' => now()->toIso8601String()];
    }

    public function certificateChain(string $hostname): array
    {
        $target = $this->guard->validate($this->normalUrl($hostname, 'https'));
        [$params, $crypto] = $this->tlsConnect($target);
        $certificates = [];
        foreach (($params['options']['ssl']['peer_certificate_chain'] ?? []) as $index => $certificate) {
            $parsed = openssl_x509_parse($certificate);
            if (! is_array($parsed)) {
                continue;
            }
            openssl_x509_export($certificate, $pem);
            $certificates[] = ['position' => $index === 0 ? 'leaf' : 'intermediate', 'subject' => $parsed['subject'] ?? [], 'issuer' => $parsed['issuer'] ?? [], 'serial_number' => $parsed['serialNumberHex'] ?? $parsed['serialNumber'] ?? null, 'valid_from' => isset($parsed['validFrom_time_t']) ? date(DATE_ATOM, $parsed['validFrom_time_t']) : null, 'valid_to' => isset($parsed['validTo_time_t']) ? date(DATE_ATOM, $parsed['validTo_time_t']) : null, 'signature_algorithm' => $parsed['signatureTypeSN'] ?? null, 'sha256_fingerprint' => openssl_x509_fingerprint($pem, 'sha256') ?: null, 'self_signed' => ($parsed['subject'] ?? null) === ($parsed['issuer'] ?? null)];
        }

        return ['hostname' => $target['host'], 'chain_verified' => true, 'hostname_match' => true, 'protocol' => $crypto['protocol'] ?? null, 'certificates' => $certificates, 'root_note' => 'Servers commonly omit the trusted root certificate; only certificates actually served are listed.', 'checked_at' => now()->toIso8601String()];
    }

    public function tlsVersions(string $hostname): array
    {
        $target = $this->guard->validate($this->normalUrl($hostname, 'https'));
        $versions = ['TLS 1.0' => 'Not tested by current runtime', 'TLS 1.1' => 'Not tested by current runtime'];
        foreach (['TLS 1.2' => STREAM_CRYPTO_METHOD_TLSv1_2_CLIENT, 'TLS 1.3' => defined('STREAM_CRYPTO_METHOD_TLSv1_3_CLIENT') ? STREAM_CRYPTO_METHOD_TLSv1_3_CLIENT : null] as $label => $method) {
            if ($method === null) {
                $versions[$label] = 'Not tested by current runtime';

                continue;
            }
            try {
                $this->tlsConnect($target, $method);
                $versions[$label] = 'Supported';
            } catch (\Throwable) {
                $versions[$label] = 'Disabled or unsupported';
            }
        }

        return ['hostname' => $target['host'], 'versions' => $versions, 'checked_at' => now()->toIso8601String()];
    }

    public function httpsHealth(string $input): array
    {
        $validated = $this->guard->validate($this->normalUrl($input, 'https'));
        $host = $validated['host'];
        $http = null;
        $https = null;
        $certificate = null;
        $warnings = [];
        try {
            $http = $this->redirects("http://{$host}/");
        } catch (\Throwable) {
            $warnings[] = 'HTTP did not respond.';
        }
        try {
            $https = $this->redirects("https://{$host}/");
            $certificate = $this->certificate($host);
        } catch (\Throwable) {
            $warnings[] = 'HTTPS or its certificate could not be verified.';
        }
        $headers = $https ? $this->headers($https['final_url']) : null;
        $redirectsToHttps = $http ? str_starts_with($http['final_url'], 'https://') : false;
        if (! $redirectsToHttps) {
            $warnings[] = 'HTTP does not redirect to HTTPS.';
        }
        if (! ($headers['security_headers_present']['strict-transport-security'] ?? false)) {
            $warnings[] = 'HSTS header not observed.';
        }

        return ['hostname' => $host, 'status' => $https && $warnings === [] ? 'HTTPS configured correctly' : ($https ? 'HTTPS has warnings' : 'HTTPS unavailable'), 'http_responds' => $http !== null, 'http_redirects_to_https' => $redirectsToHttps, 'https_responds' => $https !== null, 'final_url' => $https['final_url'] ?? null, 'http_status' => $https['hops'][array_key_last($https['hops'])]['status'] ?? null, 'certificate_valid' => $certificate['valid'] ?? false, 'hostname_match' => $certificate['hostname_match'] ?? false, 'days_remaining' => $certificate['days_remaining'] ?? null, 'hsts' => $headers['security_headers_present']['strict-transport-security'] ?? false, 'redirect_count' => $https['redirect_count'] ?? null, 'warnings' => $warnings, 'checked_at' => now()->toIso8601String()];
    }

    private function normalUrl(string $input, string $scheme): string
    {
        $input = trim($input);
        $url = preg_match('#^https?://#i', $input) ? $input : "{$scheme}://{$input}/";
        $parts = parse_url($url);
        if (isset($parts['port'])) {
            throw new InvalidArgumentException('Custom ports are not allowed for this check.');
        }

        return $url;
    }

    private function tlsConnect(array $target, ?int $cryptoMethod = null): array
    {
        $ip = $target['ips'][0];
        $ssl = ['capture_peer_cert' => true, 'capture_peer_cert_chain' => true, 'verify_peer' => true, 'verify_peer_name' => true, 'peer_name' => $target['host'], 'SNI_enabled' => true];
        if ($cryptoMethod !== null) {
            $ssl['crypto_method'] = $cryptoMethod;
        }
        $context = stream_context_create(['ssl' => $ssl]);
        $endpoint = str_contains($ip, ':') ? "ssl://[{$ip}]:443" : "ssl://{$ip}:443";
        $socket = @stream_socket_client($endpoint, $code, $message, (float) config('network.socket_timeout_seconds'), STREAM_CLIENT_CONNECT, $context);
        if (! is_resource($socket)) {
            throw new InvalidArgumentException('TLS connection failed: '.($message ?: 'handshake failed.'));
        }
        $params = stream_context_get_params($socket);
        $crypto = stream_get_meta_data($socket)['crypto'] ?? [];
        fclose($socket);

        return [$params, $crypto];
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
