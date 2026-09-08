<?php

namespace App\Services\Phone;

use libphonenumber\NumberParseException;
use libphonenumber\PhoneNumberFormat;
use libphonenumber\PhoneNumberUtil;

final class E164Formatter
{
    public function format(string $input, ?string $region = null, ?string $callingCode = null): array
    {
        $input = trim($input);
        if (str_starts_with($input, '00')) {
            $input = '+'.substr($input, 2);
        } if ($callingCode && ! str_starts_with($input, '+')) {
            $input = '+'.ltrim($callingCode, '+').preg_replace('/\D+/', '', $input);
        } $util = PhoneNumberUtil::getInstance();
        try {
            $number = $util->parse($input, $region ? strtoupper($region) : 'ZZ');
            if (! $util->isPossibleNumber($number)) {
                return $this->invalid('The number length is not possible for the selected country.');
            }if (! $util->isValidNumber($number)) {
                return $this->invalid('The number pattern is not valid for the selected country.');
            }

            return ['valid' => true, 'e164' => $util->format($number, PhoneNumberFormat::E164), 'international' => $util->format($number, PhoneNumberFormat::INTERNATIONAL), 'national' => $util->format($number, PhoneNumberFormat::NATIONAL), 'country_code' => $number->getCountryCode(), 'region' => $util->getRegionCodeForNumber($number), 'error' => null];
        } catch (NumberParseException $e) {
            return $this->invalid(match ($e->getErrorType()) {
                NumberParseException::INVALID_COUNTRY_CODE => 'Choose a country or include an international calling code.',NumberParseException::TOO_SHORT_NSN,NumberParseException::TOO_SHORT_AFTER_IDD => 'The phone number is too short.',NumberParseException::TOO_LONG => 'The phone number is too long.',default => 'The phone number could not be parsed.'
            });
        }
    }

    private function invalid(string $error): array
    {
        return ['valid' => false, 'e164' => null, 'international' => null, 'national' => null, 'country_code' => null, 'region' => null, 'error' => $error];
    }
}
