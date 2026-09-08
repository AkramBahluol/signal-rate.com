<?php

namespace App\Services\Network\Contracts;

use App\Services\Network\ProviderResult;

interface RdapProvider
{
    public function lookup(string $ip): ProviderResult;
}
