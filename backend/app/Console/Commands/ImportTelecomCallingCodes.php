<?php

namespace App\Console\Commands;

use App\Services\Import\CountryImporter;
use Illuminate\Console\Command;

final class ImportTelecomCallingCodes extends Command
{
    protected $signature = 'telecom:import-calling-codes {path? : Country/calling-code JSON source file}';

    protected $description = 'Import country calling-code relationships from the controlled dataset';

    public function handle(CountryImporter $importer): int
    {
        $path = $this->argument('path') ?: database_path('data/countries.json');
        if (! is_file($path)) {
            $this->error("Calling-code source file not found: {$path}");

            return self::FAILURE;
        }
        $summary = $importer->importWithSummary($path);
        $this->info("Calling codes: {$summary['codes_added']} added, {$summary['codes_updated']} updated.");

        return self::SUCCESS;
    }
}
