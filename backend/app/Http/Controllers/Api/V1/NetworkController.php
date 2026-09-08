<?php

namespace App\Http\Controllers\Api\V1;

use App\Services\Network\AsnLookupService;
use App\Services\Network\BlacklistRegistry;
use App\Services\Network\DnsLookupService;
use App\Services\Network\EmailSecurityService;
use App\Services\Network\NetworkAddress;
use App\Services\Network\NetworkLookupService;
use App\Services\Network\PortChecker;
use App\Services\Network\SubnetCalculator;
use App\Services\Network\WebDiagnosticsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use InvalidArgumentException;

final class NetworkController
{
    public function myIp(Request $request, NetworkLookupService $lookups): JsonResponse
    {
        return $this->respond(fn () => $lookups->lookup((string) $request->ip()));
    }

    public function ip(string $ip, NetworkLookupService $lookups): JsonResponse
    {
        return $this->respond(fn () => $lookups->lookup($ip));
    }

    public function asn(string $asn, AsnLookupService $lookups): JsonResponse
    {
        return $this->respond(fn () => $lookups->lookup($asn));
    }

    public function rdap(string $ip, NetworkLookupService $lookups): JsonResponse
    {
        return $this->respond(fn () => $lookups->rdap($ip));
    }

    public function reverseDns(string $ip, NetworkLookupService $lookups): JsonResponse
    {
        return $this->respond(fn () => $lookups->reverseDns($ip));
    }

    public function hostname(Request $request, DnsLookupService $dns): JsonResponse
    {
        $data = $request->validate(['hostname' => ['required', 'string', 'max:253']]);

        return $this->respond(fn () => $dns->hostname($data['hostname']));
    }

    public function dns(Request $request, DnsLookupService $dns): JsonResponse
    {
        $data = $request->validate(['hostname' => ['required', 'string', 'max:253'], 'type' => ['required', 'string', Rule::in(config('network.dns_record_types'))]]);

        return $this->respond(fn () => $dns->lookup($data['hostname'], $data['type']));
    }

    public function port(Request $request, PortChecker $ports): JsonResponse
    {
        $data = $request->validate(['host' => ['required', 'string', 'max:253'], 'port' => ['required', 'integer', 'between:1,65535']]);

        return $this->respond(fn () => $ports->check($data['host'], (int) $data['port']));
    }

    public function blacklist(Request $request, BlacklistRegistry $blacklists): JsonResponse
    {
        $data = $request->validate(['ip' => ['required', 'ip']]);

        return $this->respond(fn () => $blacklists->check($data['ip']));
    }

    public function subnet(Request $request, SubnetCalculator $subnets): JsonResponse
    {
        $data = $request->validate(['ip' => ['required', 'ipv4'], 'cidr' => ['required', 'integer', 'between:0,32']]);

        return $this->respond(fn () => $subnets->calculate($data['ip'], (int) $data['cidr']));
    }

    public function cidr(Request $request, SubnetCalculator $subnets, NetworkAddress $addresses): JsonResponse
    {
        $data = $request->validate(['cidr' => ['nullable', 'string', 'max:50', 'required_without:netmask'], 'netmask' => ['nullable', 'ipv4', 'required_without:cidr']]);

        return $this->respond(function () use ($data, $subnets, $addresses): array {
            if (isset($data['netmask'])) {
                $prefix = $subnets->netmaskToCidr($data['netmask']);

                return ['netmask' => $data['netmask'], 'cidr' => $prefix, 'total_addresses' => 2 ** (32 - $prefix)];
            }
            [$ip, $prefix] = $addresses->parseCidr($data['cidr']);
            if ($addresses->version($ip) !== 4) {
                throw new InvalidArgumentException('CIDR calculator currently supports IPv4 ranges.');
            }

            return $subnets->calculate($ip, $prefix);
        });
    }

    public function classify(Request $request, NetworkAddress $addresses): JsonResponse
    {
        $data = $request->validate(['ip' => ['required', 'ip']]);

        return $this->respond(fn () => $addresses->classification($data['ip']));
    }

    public function spf(Request $request, EmailSecurityService $email): JsonResponse
    {
        $data = $request->validate(['domain' => ['required', 'string', 'max:253']]);

        return $this->respond(fn () => $email->spf($data['domain']));
    }

    public function dmarc(Request $request, EmailSecurityService $email): JsonResponse
    {
        $data = $request->validate(['domain' => ['required', 'string', 'max:253']]);

        return $this->respond(fn () => $email->dmarc($data['domain']));
    }

    public function dkim(Request $request, EmailSecurityService $email): JsonResponse
    {
        $data = $request->validate(['domain' => ['required', 'string', 'max:253'], 'selector' => ['required', 'string', 'max:63']]);

        return $this->respond(fn () => $email->dkim($data['domain'], $data['selector']));
    }

    public function redirects(Request $request, WebDiagnosticsService $web): JsonResponse
    {
        $data = $request->validate(['url' => ['required', 'string', 'max:2048']]);

        return $this->respond(fn () => $web->redirects($data['url']));
    }

    public function headers(Request $request, WebDiagnosticsService $web): JsonResponse
    {
        $data = $request->validate(['url' => ['required', 'string', 'max:2048']]);

        return $this->respond(fn () => $web->headers($data['url']));
    }

    public function ssl(Request $request, WebDiagnosticsService $web): JsonResponse
    {
        $data = $request->validate(['hostname' => ['required', 'string', 'max:253']]);

        return $this->respond(fn () => $web->certificate($data['hostname']));
    }

    public function availability(Request $request, WebDiagnosticsService $web): JsonResponse
    {
        $data = $request->validate(['target' => ['required', 'string', 'max:2048']]);

        return $this->respond(fn () => $web->availability($data['target']));
    }

    public function certificateChain(Request $request, WebDiagnosticsService $web): JsonResponse
    {
        $data = $request->validate(['target' => ['required', 'string', 'max:253']]);

        return $this->respond(fn () => $web->certificateChain($data['target']));
    }

    public function tlsVersions(Request $request, WebDiagnosticsService $web): JsonResponse
    {
        $data = $request->validate(['target' => ['required', 'string', 'max:253']]);

        return $this->respond(fn () => $web->tlsVersions($data['target']));
    }

    public function httpsHealth(Request $request, WebDiagnosticsService $web): JsonResponse
    {
        $data = $request->validate(['target' => ['required', 'string', 'max:2048']]);

        return $this->respond(fn () => $web->httpsHealth($data['target']));
    }

    private function respond(callable $callback): JsonResponse
    {
        try {
            return response()->json(['data' => $callback()]);
        } catch (InvalidArgumentException $exception) {
            return response()->json(['message' => $exception->getMessage(), 'errors' => ['input' => [$exception->getMessage()]]], 422);
        } catch (\Throwable) {
            return response()->json(['message' => 'The network provider is temporarily unavailable.', 'data' => null], 503);
        }
    }
}
