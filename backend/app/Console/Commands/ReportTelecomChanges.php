<?php

namespace App\Console\Commands;

use App\Models\MccMncChange;
use App\Models\MccMncConflict;
use Illuminate\Console\Command;

final class ReportTelecomChanges extends Command
{
    protected $signature = 'telecom:changes {--since= : ISO date; defaults to 30 days ago}';

    protected $description = 'Summarize network assignment changes and unresolved conflicts';

    public function handle(): int
    {
        $since = $this->option('since') ?: now()->subDays(30)->toDateString();
        $changes = MccMncChange::where('created_at', '>=', $since)->selectRaw('change_type, count(*) as total')->groupBy('change_type')->pluck('total', 'change_type');
        $rows = collect(['new', 'operator_name_changed', 'status_changed', 'removed', 'reintroduced'])
            ->map(fn (string $type): array => [$type, (int) ($changes[$type] ?? 0)])->all();
        $this->table(['Change', 'Count'], $rows);
        $this->line('Open conflicts: '.MccMncConflict::where('status', 'open')->count());

        return self::SUCCESS;
    }
}
