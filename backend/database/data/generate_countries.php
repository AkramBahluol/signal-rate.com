<?php

declare(strict_types=1);

use libphonenumber\PhoneNumberUtil;

require dirname(__DIR__, 2).'/vendor/autoload.php';

$htmlPath = $argv[1] ?? null;
if (! $htmlPath || ! is_file($htmlPath) || ! isset($argv[2]) || ! is_file($argv[2])) {
    fwrite(STDERR, "Usage: php generate_countries.php <UN-M49-overview.html> [ITU-E164-extracted.txt]\n");
    exit(1);
}

$document = new DOMDocument;
@$document->loadHTMLFile($htmlPath);
$xpath = new DOMXPath($document);
$phone = PhoneNumberUtil::getInstance();
preg_match_all('/^\s*(\d{1,3})\s+\S+/m', (string) file_get_contents($argv[2]), $matches);
$ituCodes = array_fill_keys($matches[1], true);
$names = [
    'BO' => 'Bolivia', 'BN' => 'Brunei', 'CV' => 'Cape Verde', 'CD' => 'DR Congo', 'CG' => 'Republic of the Congo',
    'CI' => "Cote d'Ivoire", 'CZ' => 'Czechia', 'IR' => 'Iran', 'LA' => 'Laos', 'FM' => 'Micronesia',
    'MD' => 'Moldova', 'KP' => 'North Korea', 'KR' => 'South Korea', 'PS' => 'Palestine', 'RU' => 'Russia',
    'SY' => 'Syria', 'TZ' => 'Tanzania', 'GB' => 'United Kingdom', 'US' => 'United States', 'VE' => 'Venezuela',
    'VN' => 'Vietnam',
];
$records = [];
$seenIso2 = [];
foreach ($xpath->query('//tr') as $row) {
    $cells = [];
    foreach ($xpath->query('./td', $row) as $cell) {
        $cells[] = trim((string) preg_replace('/\s+/', ' ', $cell->textContent));
    }
    if (count($cells) !== 15 || ! preg_match('/^\d{3}$/', $cells[9] ?? '') || ! preg_match('/^[A-Z]{2}$/', $cells[10] ?? '') || ! preg_match('/^[A-Z]{3}$/', $cells[11] ?? '')) {
        continue;
    }
    $iso2 = $cells[10];
    if (isset($seenIso2[$iso2])) {
        continue;
    }
    $seenIso2[$iso2] = true;
    $unName = html_entity_decode($cells[8], ENT_QUOTES | ENT_HTML5, 'UTF-8');
    $name = $names[$iso2] ?? $unName;
    $callingCode = $phone->getCountryCodeForRegion($iso2);
    if ($callingCode > 0 && ! isset($ituCodes[(string) $callingCode])) {
        throw new RuntimeException("Calling code {$callingCode} for {$iso2} was not found in the official ITU E.164 assignment list.");
    }
    $records[] = [
        'name' => $name,
        'official_name' => $name === $unName ? null : $unName,
        'iso2' => $iso2,
        'iso3' => $cells[11],
        'numeric_code' => $cells[9],
        'slug' => trim((string) preg_replace('/[^a-z0-9]+/', '-', strtolower((string) iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $name))), '-'),
        'continent' => $cells[3] ?: null,
        'currency_code' => null,
        'currency_name' => null,
        'calling_codes' => $callingCode > 0 ? [[
            'code' => (string) $callingCode,
            'primary' => true,
            'source_name' => 'ITU E.164 assignment list / libphonenumber metadata',
            'source_url' => 'https://www.itu.int/dms_pub/itu-t/opb/sp/T-SP-E.164D-2016-PDF-E.pdf',
            'source_type' => 'international-standard',
            'retrieved_at' => '2026-09-07T00:00:00Z',
            'last_verified_at' => '2026-09-07T00:00:00Z',
            'verification_status' => 'verified',
        ]] : [],
    ];
}
usort($records, fn (array $a, array $b): int => $a['name'] <=> $b['name']);
if (count($records) < 240) {
    throw new RuntimeException('UN M49 parsing returned too few records.');
}
$payload = [
    'dataset' => [
        'key' => 'un-m49-itu-e164-2026-09-07',
        'source_name' => 'United Nations M49 country or area codes',
        'source_url' => 'https://unstats.un.org/unsd/methodology/m49/overview',
        'source_type' => 'international-standard',
        'retrieved_at' => '2026-09-07T00:00:00Z',
        'last_verified_at' => '2026-09-07T00:00:00Z',
        'verification_status' => 'verified',
    ],
    'records' => $records,
];
file_put_contents(__DIR__.'/countries.json', json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR)."\n");
fwrite(STDOUT, 'Generated '.count($records)." country/area records.\n");
