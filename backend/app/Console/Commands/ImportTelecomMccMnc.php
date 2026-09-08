<?php

namespace App\Console\Commands;

use App\Services\Import\MccMncImporter;
use Illuminate\Console\Command;

final class ImportTelecomMccMnc extends Command
{
    protected $signature = 'telecom:import-mcc-mnc {path? : Source-aware MCC/MNC JSON file}';

    protected $description = 'Import an authoritative MCC/MNC snapshot with conflict and change tracking';

    public function handle(MccMncImporter $importer): int
    {
        $path = $this->argument('path') ?: database_path('data/mcc-mnc-germany.json');
        if (! is_file($path)) {
            $this->error("MCC/MNC source file not found: {$path}");

            return self::FAILURE;
        }
        $summary = $importer->import($path);
        $this->table(array_keys($summary), [array_values($summary)]);

        return self::SUCCESS;
    }
}
