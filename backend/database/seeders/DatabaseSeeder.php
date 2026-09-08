<?php

namespace Database\Seeders;

use App\Services\Errors\ErrorDatasetImporter;
use App\Services\Import\CountryImporter;
use App\Services\Import\MccMncImporter;
use Illuminate\Database\Seeder;

final class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        app(CountryImporter::class)->import(database_path('data/countries.json'));
        app(MccMncImporter::class)->import(database_path('data/mcc-mnc-germany.json'));
        app(ErrorDatasetImporter::class)->import(database_path('data/errors.json'));
    }
}
