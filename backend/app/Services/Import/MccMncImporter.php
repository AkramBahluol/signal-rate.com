<?php

namespace App\Services\Import;

use App\Models\Country;
use App\Models\MccMnc;
use App\Models\MccMncChange;
use App\Models\MccMncConflict;
use App\Models\Operator;
use App\Models\OperatorAlias;
use App\Models\TelecomSnapshot;
use App\Models\TelecomSource;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use RuntimeException;

final class MccMncImporter
{
    /** @return array{added:int,updated:int,unchanged:int,conflicted:int,missing:int,deactivated:int,snapshot_id:int|null} */
    public function import(string $path): array
    {
        $raw = (string) file_get_contents($path);
        $payload = json_decode($raw, true, flags: JSON_THROW_ON_ERROR);
        $sourceData = $payload['source'] ?? null;
        $records = $payload['records'] ?? null;
        if (! is_array($sourceData) || ! is_array($records) || ! array_is_list($records)) {
            throw new RuntimeException('MCC/MNC import requires source metadata and a records array.');
        }
        foreach (['key', 'name', 'authority', 'url', 'source_type', 'retrieved_at'] as $field) {
            if (! is_string($sourceData[$field] ?? null) || trim($sourceData[$field]) === '') {
                throw new RuntimeException("MCC/MNC source requires {$field}.");
            }
        }
        $normalized = array_map(fn (array $record): array => $this->normalize($record), $records);
        usort($normalized, fn (array $a, array $b): int => [$a['mcc'], $a['mnc']] <=> [$b['mcc'], $b['mnc']]);
        $checksum = hash('sha256', json_encode(['version' => $sourceData['version'] ?? null, 'records' => $normalized], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR));

        return DB::transaction(function () use ($sourceData, $normalized, $raw, $checksum): array {
            $source = TelecomSource::updateOrCreate(['key' => $sourceData['key']], [
                'name' => $sourceData['name'], 'authority' => $sourceData['authority'], 'url' => $sourceData['url'],
                'source_type' => $sourceData['source_type'], 'license_notes' => $sourceData['license_notes'] ?? null,
                'attribution' => $sourceData['attribution'] ?? null, 'active' => true,
            ]);
            $existingSnapshot = TelecomSnapshot::where(['telecom_source_id' => $source->id, 'dataset_type' => 'mcc_mnc', 'checksum' => $checksum])->first();
            if ($existingSnapshot) {
                return ['added' => 0, 'updated' => 0, 'unchanged' => count($normalized), 'conflicted' => 0, 'missing' => 0, 'deactivated' => 0, 'snapshot_id' => $existingSnapshot->id];
            }
            $snapshot = TelecomSnapshot::create([
                'telecom_source_id' => $source->id, 'dataset_type' => 'mcc_mnc', 'source_version' => $sourceData['version'] ?? null,
                'checksum' => $checksum, 'retrieved_at' => $sourceData['retrieved_at'], 'record_count' => count($normalized), 'raw_payload' => base64_encode(gzencode($raw)),
            ]);
            $summary = ['added' => 0, 'updated' => 0, 'unchanged' => 0, 'conflicted' => 0, 'missing' => 0, 'deactivated' => 0, 'snapshot_id' => $snapshot->id];
            $seen = [];
            foreach ($normalized as $record) {
                $identity = $record['mcc'].'-'.$record['mnc'];
                $seen[] = $identity;
                $country = Country::where('iso2', $record['country_iso2'])->first();
                if (! $country) {
                    throw new RuntimeException("Unknown country {$record['country_iso2']} for {$identity}; import countries first.");
                }
                $operator = $this->matchExplicitOperator($country->id, $record['operator'] ?? null, $sourceData);
                $incoming = [
                    'country_id' => $country->id, 'operator_id' => $operator?->id, 'mcc' => $record['mcc'], 'mnc' => $record['mnc'],
                    'mnc_length' => strlen($record['mnc']), 'assignment_name' => $record['assignment_name'], 'network_brand' => $operator?->brand,
                    'assignment_status' => $record['status'], 'active' => $record['status'] === 'active', 'source_name' => $source->name,
                    'source_url' => $source->url, 'source_type' => $source->source_type, 'retrieved_at' => $sourceData['retrieved_at'],
                    'last_verified_at' => $sourceData['last_verified_at'] ?? $sourceData['retrieved_at'], 'verification_status' => 'verified',
                    'managed_by_import' => $source->key, 'last_seen_at' => $sourceData['retrieved_at'], 'missing_observations' => 0,
                    'content_hash' => hash('sha256', json_encode($record, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR)),
                ];
                $existing = MccMnc::where(['mcc' => $record['mcc'], 'mnc' => $record['mnc']])->first();
                if (! $existing) {
                    $assignment = MccMnc::create($incoming);
                    $this->change($assignment, $snapshot, 'new', null, $incoming);
                    $summary['added']++;

                    continue;
                }
                if ($existing->verification_status === 'verified' && $existing->managed_by_import !== $source->key
                    && $existing->assignment_name !== $incoming['assignment_name']) {
                    MccMncConflict::create(['mcc_mnc_id' => $existing->id, 'telecom_snapshot_id' => $snapshot->id, 'existing_value' => $existing->only(['assignment_name', 'source_name', 'source_url']), 'incoming_value' => $incoming]);
                    $existing->update(['verification_status' => 'conflicted']);
                    $summary['conflicted']++;

                    continue;
                }
                $before = $existing->only(['assignment_name', 'assignment_status', 'active', 'operator_id']);
                $changeType = null;
                if ($existing->missing_observations > 0 || ! $existing->active && $incoming['active']) {
                    $changeType = 'reintroduced';
                } elseif ($existing->assignment_name !== $incoming['assignment_name']) {
                    $changeType = 'operator_name_changed';
                } elseif ($existing->assignment_status !== $incoming['assignment_status']) {
                    $changeType = 'status_changed';
                }
                if ($existing->content_hash === $incoming['content_hash'] && $existing->missing_observations === 0) {
                    $existing->update(['last_seen_at' => $incoming['last_seen_at'], 'retrieved_at' => $incoming['retrieved_at'], 'last_verified_at' => $incoming['last_verified_at']]);
                    $summary['unchanged']++;

                    continue;
                }
                $existing->update($incoming);
                if ($changeType) {
                    $this->change($existing, $snapshot, $changeType, $before, $incoming);
                }
                $summary['updated']++;
            }

            MccMnc::where('managed_by_import', $source->key)->get()->each(function (MccMnc $assignment) use ($seen, $snapshot, &$summary): void {
                if (in_array($assignment->mcc.'-'.$assignment->mnc, $seen, true)) {
                    return;
                }
                $missing = $assignment->missing_observations + 1;
                $updates = ['missing_observations' => $missing];
                $summary['missing']++;
                if ($missing >= 2 && $assignment->active) {
                    $updates += ['active' => false, 'assignment_status' => 'inactive', 'verification_status' => 'stale'];
                    $this->change($assignment, $snapshot, 'removed', $assignment->only(['assignment_status', 'active']), $updates);
                    $summary['deactivated']++;
                }
                $assignment->update($updates);
            });

            TelecomSnapshot::where('telecom_source_id', $source->id)->where('dataset_type', 'mcc_mnc')->orderByDesc('retrieved_at')->skip(12)->take(1000)->delete();

            return $summary;
        });
    }

    /** @param array<string,mixed> $record @return array<string,mixed> */
    private function normalize(array $record): array
    {
        $mcc = trim((string) ($record['mcc'] ?? ''));
        $mnc = trim((string) ($record['mnc'] ?? ''));
        if (! preg_match('/^\d{3}$/', $mcc) || ! preg_match('/^\d{2,3}$/', $mnc)) {
            throw new RuntimeException('MCC must have 3 digits and MNC must have 2 or 3 digits; leading zeros are significant.');
        }
        if (! preg_match('/^[A-Z]{2}$/', (string) ($record['country_iso2'] ?? ''))) {
            throw new RuntimeException("Country ISO2 is invalid for {$mcc}-{$mnc}.");
        }
        if (! is_string($record['assignment_name'] ?? null) || trim($record['assignment_name']) === '') {
            throw new RuntimeException("Assignment name is required for {$mcc}-{$mnc}.");
        }
        $status = $record['status'] ?? 'unknown';
        if (! in_array($status, ['active', 'inactive', 'deprecated', 'unknown'], true)) {
            throw new RuntimeException("Assignment status is invalid for {$mcc}-{$mnc}.");
        }

        return [...$record, 'mcc' => $mcc, 'mnc' => $mnc, 'country_iso2' => strtoupper($record['country_iso2']), 'assignment_name' => trim($record['assignment_name']), 'status' => $status];
    }

    /** @param array<string,mixed>|null $operatorData @param array<string,mixed> $sourceData */
    private function matchExplicitOperator(int $countryId, ?array $operatorData, array $sourceData): ?Operator
    {
        if (! $operatorData || empty($operatorData['slug']) || empty($operatorData['name'])) {
            return null;
        }
        $operator = Operator::updateOrCreate(['country_id' => $countryId, 'slug' => $operatorData['slug']], [
            'name' => $operatorData['name'], 'brand' => $operatorData['brand'] ?? null, 'website' => $operatorData['website'] ?? null,
            'prepaid' => $operatorData['prepaid'] ?? null, 'postpaid' => $operatorData['postpaid'] ?? null, 'esim' => $operatorData['esim'] ?? null,
            'four_g' => $operatorData['four_g'] ?? null, 'five_g' => $operatorData['five_g'] ?? null, 'active' => true,
            'source_name' => $sourceData['name'], 'source_url' => $sourceData['url'], 'source_type' => $sourceData['source_type'],
            'retrieved_at' => $sourceData['retrieved_at'], 'last_verified_at' => $sourceData['last_verified_at'] ?? $sourceData['retrieved_at'],
            'verification_status' => 'verified', 'managed_by_import' => $sourceData['key'],
        ]);
        foreach ($operatorData['aliases'] ?? [] as $alias) {
            OperatorAlias::updateOrCreate(['operator_id' => $operator->id, 'normalized_name' => Str::lower(trim($alias))], [
                'name' => $alias, 'alias_type' => 'assignment', 'source_name' => $sourceData['name'], 'source_url' => $sourceData['url'],
                'source_type' => $sourceData['source_type'], 'retrieved_at' => $sourceData['retrieved_at'],
                'last_verified_at' => $sourceData['last_verified_at'] ?? $sourceData['retrieved_at'], 'verification_status' => 'verified',
            ]);
        }

        return $operator;
    }

    /** @param array<string,mixed>|null $before @param array<string,mixed> $after */
    private function change(MccMnc $assignment, TelecomSnapshot $snapshot, string $type, ?array $before, array $after): void
    {
        MccMncChange::create(['mcc_mnc_id' => $assignment->id, 'telecom_snapshot_id' => $snapshot->id, 'change_type' => $type, 'before' => $before, 'after' => $after]);
    }
}
