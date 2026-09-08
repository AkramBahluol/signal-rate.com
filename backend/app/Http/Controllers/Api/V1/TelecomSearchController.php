<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\CallingCode;
use App\Models\Country;
use App\Models\MccMnc;
use App\Models\Operator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class TelecomSearchController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $term = trim((string) $request->validate(['q' => ['required', 'string', 'min:1', 'max:80']])['q']);
        $plain = trim((string) preg_replace('/\b(?:mcc|mnc)\b/i', '', $term));
        $parts = preg_split('/[\s\/-]+/', $plain) ?: [];
        $limit = min(20, max(1, (int) $request->query('limit', 10)));
        $explicitNetwork = preg_match('/\b(?:mcc|mnc)\b/i', $term) === 1;

        $countries = Country::where('active', true)->where(fn ($q) => $q->whereLike('name', "%{$term}%")->orWhereLike('official_name', "%{$term}%")
            ->orWhereRaw('lower(iso2) = ?', [strtolower($term)])->orWhereRaw('lower(iso3) = ?', [strtolower($term)]))->limit($limit)->get();
        $codes = $explicitNetwork ? collect() : CallingCode::with('country')->where('code', ltrim($plain, '+'))->limit($limit)->get();
        $networks = MccMnc::with(['country', 'operator'])->where(function ($q) use ($term, $plain, $parts): void {
            if (count($parts) >= 2 && preg_match('/^\d{3}$/', $parts[0]) && preg_match('/^\d{2,3}$/', $parts[1])) {
                $q->where(['mcc' => $parts[0], 'mnc' => $parts[1]]);

                return;
            }
            $q->where('mcc', $plain)->orWhere('mnc', $plain)->orWhereLike('assignment_name', "%{$term}%")
                ->orWhereHas('country', fn ($country) => $country->whereLike('name', "%{$term}%"))
                ->orWhereHas('operator', fn ($operator) => $operator->whereLike('name', "%{$term}%")->orWhereLike('brand', "%{$term}%")
                    ->orWhereHas('aliases', fn ($alias) => $alias->whereLike('normalized_name', '%'.strtolower($term).'%')));
        })->orderByDesc('verification_status')->limit($limit)->get();
        $operators = Operator::with(['country', 'aliases', 'networkAssignments'])->where('active', true)->where(fn ($q) => $q->whereLike('name', "%{$term}%")
            ->orWhereLike('brand', "%{$term}%")->orWhereHas('aliases', fn ($alias) => $alias->whereLike('normalized_name', '%'.strtolower($term).'%')))->limit($limit)->get();

        return response()->json(['data' => compact('countries', 'codes', 'networks', 'operators'), 'meta' => ['query' => $term]]);
    }
}
