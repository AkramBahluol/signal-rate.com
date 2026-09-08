<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\ErrorEntry;
use App\Models\ErrorFamily;
use App\Services\Errors\ErrorNormalizer;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use InvalidArgumentException;

final class ErrorController
{
    public function __construct(private readonly ErrorNormalizer $normalizer) {}

    public function families(): JsonResponse
    {
        return response()->json(['data' => Cache::remember('errors:families:v2', 3600, fn () => ErrorFamily::query()
            ->where('active', true)->withCount(['errors' => fn ($q) => $q->where('status', 'published')->where('verification_status', 'verified')])
            ->orderBy('name')->get()->filter(fn ($family) => $family->errors_count > 0)->map(fn ($family) => $this->familyData($family))->values()->all())])->header('Cache-Control', 'public, max-age=300, s-maxage=3600');
    }

    public function index(Request $request): JsonResponse
    {
        $input = $request->validate(['family' => ['nullable', 'string', 'max:30'], 'code' => ['nullable', 'string', 'max:100'], 'query' => ['nullable', 'string', 'max:100'], 'per_page' => ['nullable', 'integer', 'min:1', 'max:100']]);
        $query = $this->publicQuery();
        if (! empty($input['family'])) {
            $query->whereHas('family', fn ($q) => $q->where('key', strtolower($input['family'])));
        }
        if (! empty($input['code'])) {
            try {
                $query->where('normalized_code', $this->normalizeForFilter($input['family'] ?? null, $input['code']));
            } catch (InvalidArgumentException $exception) {
                return response()->json(['message' => $exception->getMessage()], 422);
            }
        }
        if (! empty($input['query'])) {
            $this->applySearch($query, $input['query']);
        }
        $page = $query->orderBy('family_id')->orderBy('normalized_code')->paginate($input['per_page'] ?? 50);

        return response()->json(['data' => $page->getCollection()->map(fn ($error) => $this->summary($error)), 'meta' => ['current_page' => $page->currentPage(), 'last_page' => $page->lastPage(), 'per_page' => $page->perPage(), 'total' => $page->total()]])->header('Cache-Control', 'public, max-age=300, s-maxage=3600');
    }

    public function search(Request $request): JsonResponse
    {
        $input = $request->validate(['q' => ['required', 'string', 'min:1', 'max:100'], 'family' => ['nullable', 'string', 'max:30']]);
        $query = $this->publicQuery();
        if (! empty($input['family'])) {
            $query->whereHas('family', fn ($q) => $q->where('key', strtolower($input['family'])));
        }
        $this->applySearch($query, $input['q']);

        return response()->json(['data' => $query->limit(25)->get()->map(fn ($error) => $this->summary($error))->values(), 'meta' => ['query' => $input['q'], 'family' => $input['family'] ?? null]]);
    }

    public function show(string $family, string $code): JsonResponse
    {
        $familyModel = ErrorFamily::where('key', strtolower($family))->where('active', true)->firstOrFail();
        try {
            $normalized = $this->normalizer->code($familyModel->key, urldecode($code));
        } catch (InvalidArgumentException $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        }

        $error = ErrorEntry::with(['family', 'aliases', 'causes', 'solutions', 'examples', 'sources', 'related.family'])
            ->where('family_id', $familyModel->id)->where('normalized_code', $normalized)
            ->whereIn('status', ['published', 'deprecated'])->where('verification_status', 'verified')->firstOrFail();

        return response()->json(['data' => array_merge($this->summary($error), [
            'meaning' => $error->meaning, 'diagnosis' => $error->diagnosis, 'severity' => $error->severity,
            'aliases' => $error->aliases->pluck('alias')->values(), 'causes' => $error->causes->pluck('body')->values(),
            'solutions' => $error->solutions->pluck('body')->values(),
            'examples' => $error->examples->map->only(['title', 'language', 'code', 'explanation'])->values(),
            'sources' => $error->sources->map(fn ($source) => ['title' => $source->title, 'authority' => $source->authority, 'url' => $source->url, 'source_type' => $source->source_type, 'last_verified_at' => $source->last_verified_at?->toAtomString(), 'verification_status' => $source->verification_status])->values(),
            'related' => $error->related->map(fn ($related) => array_merge($this->summary($related), ['relation_type' => $related->pivot->type, 'relation_note' => $related->pivot->note]))->values(),
        ])])->header('Cache-Control', 'public, max-age=300, s-maxage=3600');
    }

    private function publicQuery(): Builder
    {
        return ErrorEntry::with('family')->where('status', 'published')->where('verification_status', 'verified')->whereNotNull('last_verified_at');
    }

    private function applySearch(Builder $query, string $term): void
    {
        foreach (preg_split('/\s+/', trim($term)) ?: [] as $token) {
            $normalizedTerm = $this->normalizer->alias($token);
            $query->where(function (Builder $q) use ($token, $normalizedTerm): void {
                $q->whereLike('title', "%{$token}%")->orWhereLike('short_description', "%{$token}%")
                    ->orWhereLike('normalized_code', strtoupper($token))
                    ->orWhereHas('aliases', fn ($aliases) => $aliases->whereLike('normalized_alias', "%{$normalizedTerm}%"))
                    ->orWhereHas('family', fn ($family) => $family->whereLike('name', "%{$token}%")->orWhereLike('key', "%{$token}%"));
            });
        }
    }

    private function normalizeForFilter(?string $family, string $code): string
    {
        if (! $family) {
            throw new InvalidArgumentException('The family filter is required when filtering by code.');
        }

        return $this->normalizer->code($family, $code);
    }

    private function summary(ErrorEntry $error): array
    {
        return ['id' => $error->id, 'family' => $this->familyData($error->family), 'code' => $error->code, 'normalized_code' => $error->normalized_code, 'slug' => $error->slug, 'title' => $error->title, 'short_description' => $error->short_description, 'status' => $error->status, 'source_name' => $error->source_name, 'source_url' => $error->source_url, 'source_type' => $error->source_type, 'last_verified_at' => $error->last_verified_at?->toAtomString(), 'verification_status' => $error->verification_status, 'url' => "/errors/{$error->family->slug}/{$error->slug}"];
    }

    private function familyData(ErrorFamily $family): array
    {
        return ['key' => $family->key, 'name' => $family->name, 'slug' => $family->slug, 'description' => $family->description, 'error_count' => $family->errors_count ?? null];
    }
}
