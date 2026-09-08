<?php

use App\Http\Controllers\Api\V1\CarrierController;
use App\Http\Controllers\Api\V1\DirectoryController;
use App\Http\Controllers\Api\V1\E164Controller;
use App\Http\Controllers\Api\V1\ErrorController;
use App\Http\Controllers\Api\V1\ExchangeRateController;
use App\Http\Controllers\Api\V1\MobilePlanController;
use App\Http\Controllers\Api\V1\NetworkController;
use App\Http\Controllers\Api\V1\SearchController;
use App\Http\Controllers\Api\V1\SmsController;
use App\Http\Controllers\Api\V1\TelecomSearchController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->middleware('throttle:directory')->group(function (): void {
    Route::post('/gsm7/check', [SmsController::class, 'check']);
    Route::post('/sms/calculate', [SmsController::class, 'calculate']);
    Route::post('/e164/format', [E164Controller::class, 'format']);
    Route::post('/exchange-rates/convert', [ExchangeRateController::class, 'convert']);
    Route::get('/countries', [DirectoryController::class, 'countries']);
    Route::get('/countries/{iso2}', [DirectoryController::class, 'country']);
    Route::get('/calling-codes/{code}', [DirectoryController::class, 'callingCode']);
    Route::get('/mcc', [DirectoryController::class, 'networks']);
    Route::get('/mcc/{mcc}', [DirectoryController::class, 'mcc']);
    Route::get('/mcc/{mcc}/{mnc}', [DirectoryController::class, 'mnc']);
    Route::get('/carriers', [CarrierController::class, 'index']);
    Route::get('/carriers/{country}', [CarrierController::class, 'country']);
    Route::get('/carriers/{country}/{operator}', [CarrierController::class, 'show']);
    Route::get('/telecom/search', TelecomSearchController::class);
    Route::get('/mobile-plans/search', [MobilePlanController::class, 'search']);
    Route::get('/mobile-plans/country/{iso2}/operator/{operator}', [MobilePlanController::class, 'operator']);
    Route::get('/mobile-plans/country/{iso2}', [MobilePlanController::class, 'country']);
    Route::get('/mobile-plans', [MobilePlanController::class, 'index']);
    Route::get('/mobile-plans/{id}', [MobilePlanController::class, 'show'])->whereNumber('id');
    Route::get('/search', SearchController::class);
    Route::get('/error-families', [ErrorController::class, 'families']);
    Route::get('/errors/search', [ErrorController::class, 'search']);
    Route::get('/errors', [ErrorController::class, 'index']);
    Route::get('/errors/{family}/{code}', [ErrorController::class, 'show']);
});

Route::prefix('v1/network')->middleware('throttle:30,1')->group(function (): void {
    Route::get('/my-ip', [NetworkController::class, 'myIp']);
    Route::get('/ip/{ip}', [NetworkController::class, 'ip']);
    Route::get('/asn/{asn}', [NetworkController::class, 'asn']);
    Route::get('/rdap/{ip}', [NetworkController::class, 'rdap']);
    Route::get('/reverse-dns/{ip}', [NetworkController::class, 'reverseDns']);
    Route::get('/hostname', [NetworkController::class, 'hostname']);
    Route::get('/dns', [NetworkController::class, 'dns']);
    Route::post('/subnet/calculate', [NetworkController::class, 'subnet']);
    Route::post('/cidr/calculate', [NetworkController::class, 'cidr']);
    Route::post('/ip/calculate', [NetworkController::class, 'classify']);
});

Route::prefix('v1/network')->middleware('throttle:5,1')->group(function (): void {
    Route::get('/email/spf', [NetworkController::class, 'spf']);
    Route::get('/email/dkim', [NetworkController::class, 'dkim']);
    Route::get('/email/dmarc', [NetworkController::class, 'dmarc']);
    Route::post('/port-check', [NetworkController::class, 'port']);
    Route::post('/blacklist/check', [NetworkController::class, 'blacklist']);
    Route::post('/redirect-check', [NetworkController::class, 'redirects']);
    Route::post('/http-headers', [NetworkController::class, 'headers']);
    Route::post('/ssl-certificate', [NetworkController::class, 'ssl']);
    Route::post('/availability', [NetworkController::class, 'availability']);
    Route::post('/certificate-chain', [NetworkController::class, 'certificateChain']);
    Route::post('/tls-versions', [NetworkController::class, 'tlsVersions']);
    Route::post('/https-health', [NetworkController::class, 'httpsHealth']);
});
