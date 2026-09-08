<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\CallingCode;
use App\Models\Country;
use App\Models\MccMnc;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class DirectoryController extends Controller
{
    public function countries(Request $request): JsonResponse
    {
        $query = Country::with('callingCodes')->where('active', true)->orderBy('name');
        if ($search = trim((string) $request->query('q'))) {
            $query->where(fn ($q) => $q->whereLike('name', "%{$search}%")
                ->orWhereLike('official_name', "%{$search}%")
                ->orWhereLike('iso2', $search)->orWhereLike('iso3', $search));
        }

        return $this->paginated($query, $request);
    }

    public function country(string $iso2): JsonResponse
    {
        return response()->json(['data' => Country::with([
            'callingCodes',
            'operators' => fn ($query) => $query->where('active', true)->with('networkAssignments'),
            'networkAssignments' => fn ($query) => $query->where('active', true)->orderBy('mcc')->orderBy('mnc'),
        ])->withCount(['networkAssignments as verified_network_assignments_count' => fn ($query) => $query->where('verification_status', 'verified')->where('active', true)])
            ->where(fn ($query) => $query->whereRaw('lower(iso2) = ?', [strtolower($iso2)])->orWhere('slug', strtolower($iso2)))
            ->where('active', true)->firstOrFail()]);
    }

    public function callingCode(string $code): JsonResponse
    {
        $code = ltrim($code, '+');
        abort_unless(preg_match('/^\d{1,4}$/', $code), 422, 'Calling code must contain 1 to 4 digits.');

        return response()->json(['data' => CallingCode::with('country')->where('code', $code)->get()]);
    }

    public function networks(Request $request): JsonResponse
    {
        $validated = $request->validate(['q' => ['nullable', 'string', 'max:80']]);
        $term = trim((string) ($validated['q'] ?? ''));
        $query = MccMnc::with(['country', 'operator.aliases']);
        if ($term !== '') {
            $normalized = trim((string) preg_replace('/\b(?:mcc|mnc)\b/i', '', $term));
            $parts = preg_split('/[\s\/-]+/', $normalized) ?: [];
            $query->where(function ($builder) use ($term, $normalized, $parts): void {
                if (count($parts) >= 2 && preg_match('/^\d{3}$/', $parts[0]) && preg_match('/^\d{2,3}$/', $parts[1])) {
                    $builder->where(['mcc' => $parts[0], 'mnc' => $parts[1]]);

                    return;
                }
                $builder->where('mcc', 'like', "%{$normalized}%")
                    ->orWhere('mnc', 'like', "%{$normalized}%")
                    ->orWhereLike('assignment_name', "%{$term}%")
                    ->orWhereLike('network_brand', "%{$term}%")
                    ->orWhereHas('country', fn ($q) => $q->whereLike('name', "%{$term}%"))
                    ->orWhereHas('operator', fn ($q) => $q->whereLike('name', "%{$term}%")->orWhereLike('brand', "%{$term}%")
                        ->orWhereHas('aliases', fn ($aliases) => $aliases->whereLike('normalized_name', '%'.strtolower($term).'%')));
            });
        }

        return $this->paginated($query->orderBy('mcc')->orderBy('mnc'), $request, 25, 100);
    }

    public function mcc(Request $request, string $mcc): JsonResponse
    {
        abort_unless(preg_match('/^\d{3}$/', $mcc), 422, 'MCC must contain exactly 3 digits.');
        $query = MccMnc::with(['country', 'operator'])->where('mcc', $mcc);
        if ($search = trim((string) $request->query('q'))) {
            $query->where(fn ($q) => $q->where('mnc', 'like', "%{$search}%")->orWhereLike('network_brand', "%{$search}%"));
        }

        return $this->paginated($query->orderBy('mnc'), $request, 50, 100);
    }

    public function mnc(string $mcc, string $mnc): JsonResponse
    {
        abort_unless(preg_match('/^\d{3}$/', $mcc) && preg_match('/^\d{2,3}$/', $mnc), 422, 'MCC/MNC format is invalid.');

        return response()->json(['data' => MccMnc::with(['country', 'operator'])->where(['mcc' => $mcc, 'mnc' => $mnc])->firstOrFail()]);
    }

    private function paginated($query, Request $request, int $default = 50, int $maximum = 100): JsonResponse
    {
        $perPage = min($maximum, max(1, (int) $request->query('per_page', $default)));
        $page = $query->paginate($perPage);

        return response()->json(['data' => $page->items(), 'meta' => [
            'current_page' => $page->currentPage(), 'last_page' => $page->lastPage(), 'per_page' => $page->perPage(), 'total' => $page->total(),
        ]]);
    }
}
