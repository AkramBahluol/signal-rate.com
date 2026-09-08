<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\Sms\SmsAnalyzer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class SmsController extends Controller
{
    public function check(Request $request, SmsAnalyzer $analyzer): JsonResponse
    {
        return response()->json($analyzer->analyze($request->validate(['message' => ['required', 'string', 'max:10000']])['message']));
    }

    public function calculate(Request $request, SmsAnalyzer $analyzer): JsonResponse
    {
        return $this->check($request, $analyzer);
    }
}
