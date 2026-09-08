<?php

namespace App\Services\Network\Contracts;

use App\Services\Network\ProviderResult;

interface ReverseDnsResolver
{
    public function lookup(string $ip): ProviderResult;
}
