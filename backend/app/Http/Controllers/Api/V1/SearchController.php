<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\CallingCode;
use App\Models\Country;
use App\Models\ErrorEntry;
use App\Models\MccMnc;
use App\Models\MobilePlan;
use App\Models\Operator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class SearchController
{
    public function __invoke(Request $request): JsonResponse
    {
        $term = trim((string) $request->validate(['q' => ['required', 'string', 'min:1', 'max:80']])['q']);
        $matchesTool = fn (array $tool): bool => collect(preg_split('/\s+/', strtolower($term)) ?: [])
            ->every(fn (string $token): bool => str_contains(strtolower($tool[0].' '.$tool[2]), $token));
        $networkTools = collect(config('tool_catalog.network', [
            ['What Is My IP', '/network/what-is-my-ip', 'ip address public ipv4 ipv6'], ['IP Lookup', '/network/ip-lookup', 'ip geolocation network'],
            ['ASN Lookup', '/network/asn-lookup', 'asn autonomous system'], ['IP WHOIS / RDAP', '/network/ip-whois', 'whois rdap rir'],
            ['Reverse DNS', '/network/reverse-dns', 'ptr reverse dns'], ['Hostname Lookup', '/network/hostname-lookup', 'hostname a aaaa'],
            ['DNS Lookup', '/network/dns-lookup', 'dns mx txt cname ns soa caa'], ['Port Checker', '/network/port-checker', 'port tcp reachable'],
            ['IP Blacklist Checker', '/network/ip-blacklist-check', 'blacklist dnsbl reputation'], ['Subnet Calculator', '/network/subnet-calculator', 'subnet mask'],
            ['CIDR Calculator', '/network/cidr-calculator', 'cidr netmask range'], ['IP Calculator', '/network/ip-calculator', 'private public classify ipv6'],
        ]))->filter($matchesTool)->map(fn ($tool) => ['type' => 'network_tool', 'title' => $tool[0], 'subtitle' => 'Network utility', 'url' => $tool[1]]);
        $developerTools = collect(config('tool_catalog.developer', [
            ['JSON Formatter', '/developer-tools/json-formatter', 'json format pretty print minify'], ['JSON Validator', '/developer-tools/json-validator', 'json validate syntax'],
            ['URL Encoder / Decoder', '/developer-tools/url-encoder', 'url encode decode percent unicode'],
            ['Base64 Encoder / Decoder', '/developer-tools/base64', 'base64 encode decode base64url unicode'], ['JWT Decoder', '/developer-tools/jwt-decoder', 'jwt token header payload signature'],
            ['UUID Generator', '/developer-tools/uuid-generator', 'uuid guid v4 generate'], ['UUID Validator', '/developer-tools/uuid-validator', 'uuid guid validate version variant'],
            ['Unix Timestamp Converter', '/developer-tools/unix-timestamp', 'unix timestamp epoch seconds milliseconds'],
            ['Hash Generator', '/developer-tools/hash-generator', 'hash sha256 sha-256 sha384 sha512 digest'], ['HTML Encoder / Decoder', '/developer-tools/html-encoder', 'html encode decode entities escape'],
            ['Text Diff', '/developer-tools/text-diff', 'text diff compare added removed'], ['Slug Generator', '/developer-tools/slug-generator', 'slug seo url generate'],
        ]))->filter($matchesTool)->map(fn ($tool) => ['type' => 'developer_tool', 'title' => $tool[0], 'subtitle' => 'Browser-based developer utility', 'url' => $tool[1]]);
        $tools = collect([['SMS Character Counter', '/tools/sms-character-counter', 'sms character segment'], ['GSM-7 Checker', '/tools/gsm7-checker', 'gsm encoding sms'], ['Unicode SMS Checker', '/tools/unicode-sms-checker', 'unicode ucs2 sms'], ['SMS Segment Calculator', '/tools/sms-segment-calculator', 'multipart sms'], ['E.164 Phone Formatter', '/tools/e164-phone-formatter', 'phone number'], ['MCC/MNC Lookup', '/tools/mcc-mnc-lookup', 'network operator']])->filter($matchesTool)->map(fn ($t) => ['type' => 'tool', 'title' => $t[0], 'subtitle' => 'Tool', 'url' => $t[1]]);
        $countries = Country::where('active', true)->where(fn ($q) => $q->whereLike('name', "%{$term}%")->orWhereLike('iso2', $term)->orWhereLike('iso3', $term))->limit(8)->get()->map(fn ($c) => ['type' => 'country', 'title' => $c->name, 'subtitle' => $c->iso2.' · '.$c->continent, 'url' => '/countries/'.$c->slug]);
        $codes = CallingCode::with('country')->where('code', 'like', ltrim($term, '+').'%')->limit(8)->get()->map(fn ($c) => ['type' => 'calling_code', 'title' => '+'.$c->code, 'subtitle' => $c->country->name, 'url' => '/calling-codes/'.$c->code]);
        $networkTerm = trim((string) preg_replace('/\b(?:mcc|mnc)\b/i', '', $term));
        $networkParts = preg_split('/[\s\/-]+/', $networkTerm) ?: [];
        $networks = MccMnc::with(['operator'])->where(function ($q) use ($term, $networkTerm, $networkParts): void {
            if (count($networkParts) >= 2 && preg_match('/^\d{3}$/', $networkParts[0]) && preg_match('/^\d{2,3}$/', $networkParts[1])) {
                $q->where(['mcc' => $networkParts[0], 'mnc' => $networkParts[1]]);

                return;
            }
            $q->where('mcc', 'like', "{$networkTerm}%")->orWhere('mnc', 'like', "{$networkTerm}%")->orWhereLike('network_brand', "%{$term}%")
                ->orWhereLike('assignment_name', "%{$term}%")->orWhereHas('country', fn ($country) => $country->whereLike('name', "%{$term}%"))
                ->orWhereHas('operator.aliases', fn ($alias) => $alias->whereLike('normalized_name', '%'.strtolower($term).'%'));
        })->limit(8)->get()->map(fn ($n) => ['type' => 'network', 'title' => $n->mcc.' / '.$n->mnc, 'subtitle' => $n->assignment_name ?: ($n->operator?->name ?? 'Network'), 'url' => '/mcc/'.$n->mcc.'/'.$n->mnc]);
        $carriers = Operator::with('country')->where('active', true)->where(fn ($q) => $q->whereLike('name', "%{$term}%")->orWhereLike('brand', "%{$term}%")
            ->orWhereHas('aliases', fn ($alias) => $alias->whereLike('normalized_name', '%'.strtolower($term).'%')))->limit(8)->get()->map(fn ($o) => ['type' => 'carrier', 'title' => $o->brand ?: $o->name, 'subtitle' => $o->country->name, 'url' => '/carriers/'.$o->country->slug.'/'.$o->slug]);
        $plans = MobilePlan::with(['country', 'operator'])->where(fn ($q) => $q->whereLike('name', "%{$term}%")->orWhereHas('operator', fn ($o) => $o->whereLike('name', "%{$term}%")->orWhereLike('brand', "%{$term}%")))->limit(8)->get()->map(fn ($p) => ['type' => 'mobile_plan', 'title' => $p->name, 'subtitle' => ($p->operator->brand ?: $p->operator->name).' · '.$p->country->name, 'url' => '/mobile-plans/'.strtolower($p->country->iso2).'/'.$p->operator->slug.'/'.$p->slug]);
        $errors = ErrorEntry::with('family')->where('status', 'published')->where('verification_status', 'verified');
        foreach (preg_split('/\s+/', $term) ?: [] as $errorTerm) {
            $errors->where(function ($q) use ($errorTerm): void {
                $q->whereLike('title', "%{$errorTerm}%")->orWhereLike('short_description', "%{$errorTerm}%")->orWhereLike('normalized_code', strtoupper($errorTerm))
                    ->orWhereHas('aliases', fn ($aliases) => $aliases->whereLike('normalized_alias', '%'.strtolower($errorTerm).'%'))
                    ->orWhereHas('family', fn ($family) => $family->whereLike('name', "%{$errorTerm}%")->orWhereLike('key', "%{$errorTerm}%"));
            });
        }
        $errors = $errors->limit(8)->get()->map(fn ($error) => ['type' => 'error', 'title' => $error->family->name.' '.$error->code.' — '.$error->title, 'subtitle' => 'Verified error reference', 'url' => '/errors/'.$error->family->slug.'/'.$error->slug]);

        return response()->json(['data' => $developerTools->concat($tools)->concat($networkTools)->concat($errors)->concat($countries)->concat($codes)->concat($networks)->concat($carriers)->concat($plans)->values()]);
    }
}
