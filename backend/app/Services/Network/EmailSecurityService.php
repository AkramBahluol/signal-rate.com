<?php

namespace App\Services\Network;

use App\Services\Network\Contracts\DnsResolver;
use InvalidArgumentException;

final class EmailSecurityService
{
    public function __construct(private readonly DnsResolver $dns, private readonly HostnameValidator $hostnames) {}

    public function spf(string $domain): array
    {
        $domain = $this->hostnames->normalize($domain);
        $records = $this->matchingTxt($domain, 'v=spf1');
        if (count($records) > 1) {
            return $this->result($domain, $records, 'invalid', ['Multiple SPF records cause a permanent error.']);
        }
        if ($records === []) {
            return $this->result($domain, [], 'not_found', ['No SPF policy was published.']);
        }
        $terms = preg_split('/\s+/', trim(substr($records[0], 6))) ?: [];
        $warnings = [];
        $invalid = array_values(array_filter($terms, fn ($term) => ! preg_match('/^[+?~-]?(?:all|include:[^\s]+|redirect=[^\s]+|ip4:[^\s]+|ip6:[^\s]+|a(?::[^\s]+)?|mx(?::[^\s]+)?|exists:[^\s]+|ptr(?::[^\s]+)?|exp=[^\s]+)$/i', $term)));
        $all = collect($terms)->first(fn ($term) => preg_match('/^[+?~-]?all$/i', $term));
        $includes = array_values(array_map(fn ($term) => substr($term, strpos($term, ':') + 1), preg_grep('/^[+?~-]?include:/i', $terms)));
        $redirect = collect($terms)->first(fn ($term) => str_starts_with(strtolower($term), 'redirect='));
        $lookupCount = count(preg_grep('/^[+?~-]?(?:include:|a(?:[:\s]|$)|mx(?:[:\s]|$)|ptr(?:[:\s]|$)|exists:)/i', $terms)) + ($redirect ? 1 : 0);
        if (! $all) {
            $warnings[] = 'Policy has no explicit all mechanism.';
        }
        if ($all && ! in_array($all[0] ?? '', ['-', '~', '?'], true)) {
            $warnings[] = '+all authorizes every sender and is unsafe.';
        }
        if ($lookupCount > 10) {
            $warnings[] = 'Policy has more than 10 directly countable DNS-lookup mechanisms.';
        }
        if ($invalid) {
            $warnings[] = 'Unrecognized or invalid terms: '.implode(', ', $invalid);
        }

        return $this->result($domain, $records, $invalid ? 'invalid' : 'found', $warnings, ['mechanisms' => array_values(array_filter($terms)), 'includes' => $includes, 'redirect' => $redirect ? substr($redirect, 9) : null, 'all_qualifier' => $all ? (in_array($all[0], ['+', '-', '~', '?'], true) ? $all[0] : '+') : null, 'direct_dns_lookup_count' => $lookupCount, 'lookup_count_note' => 'Includes can add nested lookups; the final RFC limit requires recursive evaluation.']);
    }

    public function dmarc(string $domain): array
    {
        $domain = $this->hostnames->normalize($domain);
        $query = '_dmarc.'.$domain;
        $records = $this->matchingTxt($query, 'v=DMARC1');
        if ($records === []) {
            return $this->result($domain, [], 'not_found', ['No DMARC policy was published.'], ['query' => $query]);
        }
        if (count($records) > 1) {
            return $this->result($domain, $records, 'invalid', ['Multiple DMARC records are invalid.'], ['query' => $query]);
        }
        $tags = $this->tags($records[0]);
        $warnings = [];
        if (! isset($tags['p'])) {
            $warnings[] = 'Required p policy tag is missing.';
        } elseif ($tags['p'] === 'none') {
            $warnings[] = 'p=none monitors mail but does not request enforcement.';
        }

        return $this->result($domain, $records, isset($tags['p']) ? 'found' : 'invalid', $warnings, ['query' => $query, 'tags' => $tags]);
    }

    public function dkim(string $domain, string $selector): array
    {
        $domain = $this->hostnames->normalize($domain);
        $selector = strtolower(trim($selector));
        if (! preg_match('/^[a-z0-9](?:[a-z0-9_-]{0,61}[a-z0-9])?$/', $selector)) {
            throw new InvalidArgumentException('DKIM selector must contain only letters, numbers, underscores, or hyphens.');
        }
        $query = $selector.'._domainkey.'.$domain;
        $records = $this->matchingTxt($query, 'v=DKIM1');
        if ($records === []) {
            return $this->result($domain, [], 'not_found', ['No DKIM key was found for this selector.'], ['query' => $query, 'selector' => $selector]);
        }
        $tags = $this->tags($records[0]);
        $warnings = [];
        if (empty($tags['p'])) {
            $warnings[] = 'The DKIM public key is missing or revoked.';
        }

        return $this->result($domain, $records, empty($tags['p']) ? 'invalid' : 'found', $warnings, ['query' => $query, 'selector' => $selector, 'tags' => $tags]);
    }

    private function matchingTxt(string $hostname, string $prefix): array
    {
        $records = array_column($this->dns->lookup($hostname, 'TXT')['records'], 'value');

        return array_values(array_filter($records, fn ($record) => is_string($record) && str_starts_with(strtolower(trim($record)), strtolower($prefix))));
    }

    private function tags(string $record): array
    {
        $tags = [];
        foreach (explode(';', $record) as $part) {
            if (str_contains($part, '=')) {
                [$key, $value] = array_map('trim', explode('=', $part, 2));
                $tags[strtolower($key)] = $value;
            }
        }

        return $tags;
    }

    private function result(string $domain, array $records, string $status, array $warnings, array $extra = []): array
    {
        return [...$extra, 'domain' => $domain, 'status' => $status, 'records' => $records, 'warnings' => $warnings, 'provider' => 'system-resolver', 'checked_at' => now()->toIso8601String(), 'note' => 'DNS publication is reported as observed; deliverability is not guaranteed.'];
    }
}
