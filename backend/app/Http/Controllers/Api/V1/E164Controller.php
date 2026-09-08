<?php

namespace App\Http\Controllers\Api\V1;

use App\Services\Phone\E164Formatter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class E164Controller
{
    public function format(Request $request, E164Formatter $formatter): JsonResponse
    {
        $data = $request->validate(['phone' => ['required', 'string', 'max:64'], 'country' => ['nullable', 'string', 'size:2', 'regex:/^[A-Za-z]{2}$/'], 'country_calling_code' => ['nullable', 'string', 'regex:/^\+?\d{1,4}$/']]);
        $result = $formatter->format($data['phone'], $data['country'] ?? null, $data['country_calling_code'] ?? null);

        return response()->json($result, $result['valid'] ? 200 : 422);
    }
}
