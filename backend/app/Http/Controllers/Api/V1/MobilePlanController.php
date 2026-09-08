<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\MobilePlanIndexRequest;
use App\Http\Resources\MobilePlanResource;
use App\Models\MobilePlan;
use App\Services\Plans\MobilePlanQuery;
use Illuminate\Http\JsonResponse;

final class MobilePlanController
{
    public function __construct(private readonly MobilePlanQuery $plans) {}

    public function index(MobilePlanIndexRequest $request): JsonResponse
    {
        return $this->listing($request, $request->validated());
    }

    public function search(MobilePlanIndexRequest $request): JsonResponse
    {
        return $this->listing($request, $request->validated());
    }

    public function country(MobilePlanIndexRequest $request, string $iso2): JsonResponse
    {
        return $this->listing($request, [...$request->validated(), 'country' => $iso2]);
    }

    public function operator(MobilePlanIndexRequest $request, string $iso2, string $operator): JsonResponse
    {
        return $this->listing($request, [...$request->validated(), 'country' => $iso2, 'operator' => $operator]);
    }

    public function show(int $id): MobilePlanResource
    {
        return new MobilePlanResource(MobilePlan::with(['country', 'operator', 'features', 'priceHistory' => fn ($q) => $q->orderBy('observed_at'), 'verifications' => fn ($q) => $q->latest('checked_at')])->findOrFail($id));
    }

    private function listing(MobilePlanIndexRequest $request, array $filters): JsonResponse
    {
        $page = $this->plans->build($filters)->paginate((int) ($filters['per_page'] ?? 20))->withQueryString();

        return response()->json(['data' => MobilePlanResource::collection($page->items())->resolve($request), 'meta' => ['current_page' => $page->currentPage(), 'last_page' => $page->lastPage(), 'per_page' => $page->perPage(), 'total' => $page->total()]]);
    }
}
