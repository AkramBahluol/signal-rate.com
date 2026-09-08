<?php

namespace App\Http\Controllers\Api\V1;

use App\Services\ExchangeRateService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use InvalidArgumentException;

final class ExchangeRateController
{
    public function convert(Request $request, ExchangeRateService $rates): JsonResponse
    {
        $data = $request->validate(['amount' => ['required', 'numeric'], 'from' => ['required', 'string', 'size:3'], 'to' => ['required', 'string', 'size:3']]);
        try {
            return response()->json(['data' => $rates->convert((float) $data['amount'], $data['from'], $data['to'])]);
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (\Throwable) {
            return response()->json(['message' => 'Exchange rates are temporarily unavailable.'], 503);
        }
    }
}
