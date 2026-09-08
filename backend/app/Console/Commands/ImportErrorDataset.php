<?php

namespace App\Console\Commands;

use App\Services\Errors\ErrorDatasetImporter;
use Illuminate\Console\Command;

final class ImportErrorDataset extends Command
{
    protected $signature = 'errors:import {path? : JSON dataset path relative to the backend or an absolute path}';

    protected $description = 'Validate, normalize, and idempotently import a curated error knowledge dataset';

    public function handle(ErrorDatasetImporter $importer): int
    {
        $argument = $this->argument('path');
        $path = $argument ? (string) $argument : database_path('data/errors.json');
        if (! str_starts_with($path, DIRECTORY_SEPARATOR) && ! preg_match('/^[A-Za-z]:[\\\\\/]/', $path)) {
            $path = base_path($path);
        }
        if (! is_file($path)) {
            $this->error("Dataset not found: {$path}");

            return self::FAILURE;
        }
        $result = $importer->import($path);
        $this->info("Imported {$result['errors']} verified errors across {$result['families']} families.");

        return self::SUCCESS;
    }
}
