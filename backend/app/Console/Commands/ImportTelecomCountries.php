<?php

namespace App\Console\Commands;

use App\Services\Import\CountryImporter;
use Illuminate\Console\Command;

final class ImportTelecomCountries extends Command
{
    protected $signature = 'telecom:import-countries {path? : JSON source file}';

    protected $description = 'Import authoritative country and calling-code records safely';

    public function handle(CountryImporter $importer): int
    {
        $path = $this->argument('path') ?: database_path('data/countries.json');
        if (! is_file($path)) {
            $this->error("Country source file not found: {$path}");

            return self::FAILURE;
        }
        $summary = $importer->importWithSummary($path);
        $this->table(['Added', 'Updated', 'Codes added', 'Codes updated', 'Total'], [array_values($summary)]);

        return self::SUCCESS;
    }
}
