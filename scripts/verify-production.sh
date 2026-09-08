#!/usr/bin/env bash
set -Eeuo pipefail

origin="${SIGNALRATE_ORIGIN:-https://signal-rate.com}"
origin="${origin%/}"

check_200() {
    local path="$1"
    local status
    status="$(curl --silent --show-error --location --output /tmp/signalrate-response --write-out '%{http_code}' --max-time 20 "$origin$path")"
    [[ "$status" == 200 ]] || { echo "$path returned $status" >&2; exit 1; }
    if grep -Eqi 'localhost|127\.0\.0\.1' /tmp/signalrate-response; then
        echo "$path leaked a local origin." >&2
        exit 1
    fi
    echo "200 $path"
}

for path in / /about /contact /privacy /terms /data-policy /robots.txt /sitemap.xml /tools/sms-character-counter /network/what-is-my-ip /developer-tools/json-formatter /errors/http/404 /countries/germany /mcc/262; do
    check_200 "$path"
done

ads_status="$(curl --silent --output /dev/null --write-out '%{http_code}' --max-time 20 "$origin/ads.txt")"
[[ "$ads_status" == 404 ]] || { echo "ads.txt must return 404 while advertising is disabled; received $ads_status." >&2; exit 1; }

http_location="$(curl --silent --output /dev/null --write-out '%{redirect_url}' --max-time 20 http://signal-rate.com/)"
www_location="$(curl --silent --output /dev/null --write-out '%{redirect_url}' --max-time 20 https://www.signal-rate.com/)"
[[ "$http_location" == "https://signal-rate.com/" ]] || { echo "HTTP canonical redirect failed: $http_location" >&2; exit 1; }
[[ "$www_location" == "https://signal-rate.com/" ]] || { echo "www canonical redirect failed: $www_location" >&2; exit 1; }

headers="$(curl --silent --show-error --head --max-time 20 "$origin/")"
grep -Eqi '^strict-transport-security:' <<<"$headers" || { echo "HSTS header is missing." >&2; exit 1; }
grep -Eqi '^content-security-policy:' <<<"$headers" || { echo "CSP header is missing." >&2; exit 1; }

echo "Public production smoke checks passed for $origin."
