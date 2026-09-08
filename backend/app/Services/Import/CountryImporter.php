<?php

namespace App\Services\Import;

use App\Models\CallingCode;
use App\Models\Country;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use RuntimeException;

final class CountryImporter
{
    /** @return array{added:int,updated:int,codes_added:int,codes_updated:int,total:int} */
    public function importWithSummary(string $path): array
    {
        $payload = json_decode((string) file_get_contents($path), true, flags: JSON_THROW_ON_ERROR);
        $records = isset($payload['records']) ? $payload['records'] : $payload;
        $dataset = $payload['dataset'] ?? [];
        if (! is_array($records) || ! array_is_list($records)) {
            throw new RuntimeException('Country import must contain a records array.');
        }

        return DB::transaction(function () use ($records, $dataset): array {
            $summary = ['added' => 0, 'updated' => 0, 'codes_added' => 0, 'codes_updated' => 0, 'total' => count($records)];
            $manager = (string) ($dataset['key'] ?? 'country-file-import');

            foreach ($records as $record) {
                $this->validate($record);
                $record['slug'] = $record['slug'] ?? Str::slug($record['name']);
                $codes = $record['calling_codes'] ?? [];
                unset($record['calling_codes']);
                $source = [
                    'source_name' => $record['source_name'] ?? $dataset['source_name'] ?? null,
                    'source_url' => $record['source_url'] ?? $dataset['source_url'] ?? null,
                    'source_type' => $record['source_type'] ?? $dataset['source_type'] ?? null,
                    'retrieved_at' => $record['retrieved_at'] ?? $dataset['retrieved_at'] ?? null,
                    'last_verified_at' => $record['last_verified_at'] ?? $dataset['last_verified_at'] ?? null,
                    'verification_status' => $record['verification_status'] ?? $dataset['verification_status'] ?? 'unverified',
                    'managed_by_import' => $manager,
                ];
                foreach (array_keys($source) as $key) {
                    unset($record[$key]);
                }
                $record = array_filter($record, fn ($value): bool => $value !== null);
                $country = Country::firstOrNew(['iso2' => strtoupper($record['iso2'])]);
                $country->fill(array_merge($record, $source, ['iso2' => strtoupper($record['iso2']), 'iso3' => strtoupper($record['iso3']), 'active' => true]));
                $country->exists ? $summary['updated']++ : $summary['added']++;
                $country->save();

                $seen = [];
                foreach ($codes as $position => $codeRecord) {
                    $codeRecord = is_array($codeRecord) ? $codeRecord : ['code' => (string) $codeRecord];
                    $code = ltrim((string) ($codeRecord['code'] ?? ''), '+');
                    if (! preg_match('/^\d{1,4}$/', $code)) {
                        throw new RuntimeException("Invalid calling code for {$country->iso2}.");
                    }
                    $seen[] = $code;
                    $callingCode = CallingCode::firstOrNew(['country_id' => $country->id, 'code' => $code]);
                    $callingCode->fill([
                        'primary' => $codeRecord['primary'] ?? $position === 0,
                        'source_name' => $codeRecord['source_name'] ?? 'ITU E.164 assignment list / libphonenumber metadata',
                        'source_url' => $codeRecord['source_url'] ?? 'https://www.itu.int/dms_pub/itu-t/opb/sp/T-SP-E.164D-2016-PDF-E.pdf',
                        'source_type' => $codeRecord['source_type'] ?? 'international-standard',
                        'retrieved_at' => $codeRecord['retrieved_at'] ?? $source['retrieved_at'],
                        'last_verified_at' => $codeRecord['last_verified_at'] ?? $source['last_verified_at'],
                        'verification_status' => $codeRecord['verification_status'] ?? $source['verification_status'],
                        'managed_by_import' => $manager,
                    ]);
                    $callingCode->exists ? $summary['codes_updated']++ : $summary['codes_added']++;
                    $callingCode->save();
                }
                $missing = CallingCode::where('country_id', $country->id)->where('managed_by_import', $manager);
                if ($seen !== []) {
                    $missing->whereNotIn('code', $seen);
                }
                $missing->update(['verification_status' => 'deprecated', 'primary' => false]);
            }

            return $summary;
        });
    }

    public function import(string $path): int
    {
        return $this->importWithSummary($path)['total'];
    }

    /** @param array<string,mixed> $record */
    private function validate(array $record): void
    {
        foreach (['name', 'iso2', 'iso3'] as $field) {
            if (! is_string($record[$field] ?? null) || trim($record[$field]) === '') {
                throw new RuntimeException("Country record requires {$field}.");
            }
        }
        if (! preg_match('/^[A-Z]{2}$/i', $record['iso2']) || ! preg_match('/^[A-Z]{3}$/i', $record['iso3'])) {
            throw new RuntimeException('Country ISO codes are invalid.');
        }
        if (isset($record['numeric_code']) && ! preg_match('/^\d{3}$/', (string) $record['numeric_code'])) {
            throw new RuntimeException('Country numeric code must preserve exactly three digits.');
        }
    }
}
