<?php

namespace App\Services\Network\Contracts;

interface DnsResolver
{
    public function lookup(string $hostname, string $type): array;
}
