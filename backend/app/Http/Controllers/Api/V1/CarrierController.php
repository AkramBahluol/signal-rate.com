<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\Operator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class CarrierController
{
    public function country(Request $request, string $country): JsonResponse
    {
        $request->query->set('country', $country);

        return $this->index($request);
    }

    public function index(Request $request): JsonResponse
    {
        $query = Operator::with(['country', 'aliases', 'networkAssignments'])->where('active', true)->orderBy('name');
        if ($country = $request->query('country')) {
            $query->whereHas('country', fn ($q) => $q->where('iso2', strtoupper((string) $country))->orWhere('slug', $country));
        } if ($search = trim((string) $request->query('q'))) {
            $query->where(fn ($q) => $q->whereLike('name', "%{$search}%")->orWhereLike('brand', "%{$search}%")->orWhere('mcc', $search)->orWhere('mnc', $search)
                ->orWhereHas('aliases', fn ($aliases) => $aliases->whereLike('normalized_name', '%'.strtolower($search).'%')));
        }

        $page = $query->paginate(min(100, max(1, (int) $request->query('per_page', 24))));

        return response()->json(['data' => $page->items(), 'meta' => ['current_page' => $page->currentPage(), 'last_page' => $page->lastPage(), 'per_page' => $page->perPage(), 'total' => $page->total()]]);
    }

    public function show(string $country, string $operator): JsonResponse
    {
        return response()->json(['data' => Operator::with(['country', 'aliases', 'networkAssignments', 'mobilePlans' => fn ($query) => $query->where('verification_status', 'verified')])
            ->where('slug', $operator)->whereHas('country', fn ($q) => $q->where('slug', $country)->orWhere('iso2', strtoupper($country)))->firstOrFail()]);
    }
}
