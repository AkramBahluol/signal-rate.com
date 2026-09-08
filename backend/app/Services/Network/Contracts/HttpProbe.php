<?php

namespace App\Services\Network\Contracts;

interface HttpProbe
{
    public function request(array $validatedTarget): array;
}
