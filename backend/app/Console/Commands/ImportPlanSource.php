<?php

namespace App\Console\Commands;

use App\Models\PlanSource;
use App\Services\Plans\Ingestion\Contracts\PlanSourceAdapter;
use App\Services\Plans\Ingestion\Normalizers\CanonicalUkPlanNormalizer;
use App\Services\Plans\Ingestion\PlanImportService;
use Illuminate\Console\Command;
use RuntimeException;

final class ImportPlanSource extends Command
{
    protected $signature = 'plans:import-source {source : Plan source slug}';

    protected $description = 'Fetch, snapshot, normalize, validate and import one configured mobile-plan source';

    public function handle(PlanImportService $imports): int
    {
        $source = PlanSource::where('slug', $this->argument('source'))->where('active', true)->firstOrFail();
        $adapter = app($source->adapter_class);
        if (! $adapter instanceof PlanSourceAdapter) {
            throw new RuntimeException("{$source->adapter_class} must implement PlanSourceAdapter.");
        }

        $result = $imports->import($source, $adapter, new CanonicalUkPlanNormalizer);
        $this->info($result['unchanged'] ? 'Source snapshot is unchanged; no records were written.' : "Imported {$result['processed']} records from snapshot {$result['snapshot_id']}.");

        return self::SUCCESS;
    }
}
