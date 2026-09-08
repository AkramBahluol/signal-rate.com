<?php

namespace App\Services\Network\Contracts;

use App\Services\Network\ProviderResult;

interface BlacklistProvider
{
    public function name(): string;

    public function licenseNote(): string;

    public function queryMechanism(): string;

    public function timeoutSeconds(): int;

    public function lookup(string $ip): ProviderResult;
}
