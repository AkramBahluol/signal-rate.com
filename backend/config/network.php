<?php

return [
    'trusted_proxies' => array_values(array_filter(array_map('trim', explode(',', (string) env('NETWORK_TRUSTED_PROXIES', ''))))),
    'provider_timeout_seconds' => (int) env('NETWORK_PROVIDER_TIMEOUT', 5),
    'socket_timeout_seconds' => (float) env('NETWORK_SOCKET_TIMEOUT', 3),
    'max_provider_response_bytes' => (int) env('NETWORK_MAX_RESPONSE_BYTES', 1048576),
    'max_redirects' => 5,
    'lookup_cache_seconds' => (int) env('NETWORK_LOOKUP_CACHE_SECONDS', 900),
    'rdap_bootstrap_cache_seconds' => (int) env('NETWORK_RDAP_BOOTSTRAP_CACHE_SECONDS', 86400),
    'dns_cache_max_seconds' => (int) env('NETWORK_DNS_CACHE_MAX_SECONDS', 3600),
    'dns_record_types' => ['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS', 'SOA', 'CAA'],
    'blacklists' => [],
];
