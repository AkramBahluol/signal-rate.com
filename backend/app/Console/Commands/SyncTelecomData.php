<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

final class SyncTelecomData extends Command
{
    protected $signature = 'telecom:sync';

    protected $description = 'Safely import all bundled, reviewed telecom source snapshots';

    public function handle(): int
    {
        $countries = $this->call('telecom:import-countries');
        $networks = $this->call('telecom:import-mcc-mnc');

        return $countries === self::SUCCESS && $networks === self::SUCCESS ? self::SUCCESS : self::FAILURE;
    }
}
