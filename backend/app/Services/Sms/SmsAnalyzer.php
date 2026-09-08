<?php

namespace App\Services\Sms;

final class SmsAnalyzer
{
    private const BASIC = "@£\$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞ\fÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà";

    private const EXTENSION = '^{}\\[~]|€';

    /** @return array{encoding:string,characters:int,unicode_units:int,septets:int,segments:int,remaining:int,per_segment:int,extension_characters:int} */
    public function analyze(string $message): array
    {
        $characters = mb_strlen($message, 'UTF-8');
        $unicodeUnits = (int) (strlen(mb_convert_encoding($message, 'UTF-16BE', 'UTF-8')) / 2);
        $septets = 0;
        $extensions = 0;
        $gsm7 = true;
        foreach (preg_split('//u', $message, -1, PREG_SPLIT_NO_EMPTY) ?: [] as $character) {
            if (str_contains(self::BASIC, $character)) {
                $septets++;

                continue;
            }
            if (str_contains(self::EXTENSION, $character)) {
                $septets += 2;
                $extensions++;

                continue;
            }
            $gsm7 = false;
            break;
        }
        $encoding = $gsm7 ? 'GSM-7' : 'Unicode (UCS-2)';
        $length = $gsm7 ? $septets : $unicodeUnits;
        $single = $gsm7 ? 160 : 70;
        $multipart = $gsm7 ? 153 : 67;
        $segments = $length === 0 ? 0 : ($length <= $single ? 1 : (int) ceil($length / $multipart));
        $perSegment = $segments > 1 ? $multipart : $single;

        return ['encoding' => $encoding, 'characters' => $characters, 'unicode_units' => $unicodeUnits, 'septets' => $septets, 'segments' => $segments, 'remaining' => max(0, $perSegment - ($segments > 1 ? $length % $multipart ?: $multipart : $length)), 'per_segment' => $perSegment, 'extension_characters' => $extensions];
    }
}
