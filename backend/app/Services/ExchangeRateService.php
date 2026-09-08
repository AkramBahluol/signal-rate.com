<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use InvalidArgumentException;

final class ExchangeRateService
{
    private const URL = 'https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml';

    public function rates(): array
    {
        return Cache::remember('ecb.reference-rates.v1', now()->addHours(12), function (): array {
            $xml = Http::timeout(8)->retry(1, 200)->get(self::URL)->throw()->body();
            preg_match('/time=["\']([^"\']+)/', $xml, $date);
            preg_match_all('/currency=["\']([A-Z]{3})["\']\s+rate=["\']([0-9.]+)/', $xml, $matches, PREG_SET_ORDER);
            if ($matches === []) {
                throw new InvalidArgumentException('Exchange rates are temporarily unavailable.');
            }
            $rates = ['EUR' => 1.0];
            foreach ($matches as $match) {
                $rates[$match[1]] = (float) $match[2];
            }

            return ['rates' => $rates, 'updated_at' => $date[1] ?? null, 'source_name' => 'European Central Bank', 'source_url' => self::URL];
        });
    }

    public function convert(float $amount, string $from, string $to): array
    {
        $data = $this->rates();
        $from = strtoupper($from);
        $to = strtoupper($to);
        if (! isset($data['rates'][$from], $data['rates'][$to])) {
            throw new InvalidArgumentException('The selected currency is not available from the ECB reference-rate feed.');
        }
        $result = ($amount / $data['rates'][$from]) * $data['rates'][$to];

        return ['amount' => $amount, 'from' => $from, 'to' => $to, 'result' => round($result, 6), 'rate' => round($result / ($amount ?: 1), 8), 'updated_at' => $data['updated_at'], 'source_name' => $data['source_name'], 'source_url' => $data['source_url'], 'disclaimer' => 'ECB reference rates are informational and are not live market trading rates.'];
    }
}
