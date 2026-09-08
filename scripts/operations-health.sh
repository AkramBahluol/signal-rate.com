#!/usr/bin/env bash
set -Eeuo pipefail

repository_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repository_root"

configuration_file="${SIGNALRATE_OPERATIONS_ENV:-/etc/signalrate/operations.env}"
[[ -f "$configuration_file" ]] && { set -a; source "$configuration_file"; set +a; }

environment_file="${SIGNALRATE_ENV_FILE:-.env.production}"
state_directory="${SIGNALRATE_OPERATIONS_STATE_DIR:-/var/lib/signalrate-operations}"
local_origin="${SIGNALRATE_LOCAL_ORIGIN:-http://127.0.0.1:8080}"
origin_host="${SIGNALRATE_ORIGIN_HOST:-signal-rate.com}"
origin_certificate="${SIGNALRATE_ORIGIN_CERTIFICATE:-/etc/ssl/signalrate/origin.pem}"
disk_warning_percent="${SIGNALRATE_DISK_WARNING_PERCENT:-80}"
memory_warning_percent="${SIGNALRATE_MEMORY_WARNING_PERCENT:-15}"
certificate_warning_days="${SIGNALRATE_CERTIFICATE_WARNING_DAYS:-21}"
five_xx_warning_count="${SIGNALRATE_5XX_WARNING_COUNT:-1}"
access_log="${SIGNALRATE_NGINX_ACCESS_LOG:-/var/log/nginx/signalrate-access.log}"

for value in "$disk_warning_percent" "$memory_warning_percent" "$certificate_warning_days" "$five_xx_warning_count"; do
    [[ "$value" =~ ^[0-9]+$ ]] || { echo "Operations thresholds must be whole numbers." >&2; exit 2; }
done
[[ -f "$environment_file" ]] || { echo "Missing production environment file." >&2; exit 2; }

mkdir -p "$state_directory"
chmod 700 "$state_directory"
failures=()
compose=(docker compose -f docker-compose.prod.yml --env-file "$environment_file")

for service in frontend backend nginx postgres redis; do
    container_id="$("${compose[@]}" ps -q "$service")"
    if [[ -z "$container_id" ]]; then
        failures+=("${service}-missing")
        continue
    fi
    status="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$container_id")"
    [[ "$status" == healthy || "$status" == running ]] || failures+=("${service}-${status}")
    restart_count="$(docker inspect --format '{{.RestartCount}}' "$container_id")"
    (( restart_count == 0 )) || failures+=("${service}-restarts-${restart_count}")
done

http_status="$(curl --silent --show-error --header "Host: $origin_host" --output /dev/null --write-out '%{http_code}' --max-time 20 "$local_origin/")" || http_status=000
[[ "$http_status" == 200 ]] || failures+=("origin-http-${http_status}")

sitemap_status="$(curl --silent --show-error --header "Host: $origin_host" --output /tmp/signalrate-sitemap.xml --write-out '%{http_code}' --max-time 20 "$local_origin/sitemap.xml")" || sitemap_status=000
if [[ "$sitemap_status" != 200 ]] || ! grep -q '<loc>https://signal-rate.com/' /tmp/signalrate-sitemap.xml || grep -Eqi 'localhost|127\.0\.0\.1' /tmp/signalrate-sitemap.xml; then
    failures+=("sitemap-invalid")
fi

trap 'rm -f /tmp/signalrate-sitemap.xml' EXIT
if [[ ! -r "$origin_certificate" ]]; then
    failures+=("certificate-unavailable")
elif ! openssl x509 -checkend "$((certificate_warning_days * 86400))" -noout -in "$origin_certificate" >/dev/null; then
    failures+=("certificate-expiry")
fi

disk_used_percent="$(df --output=pcent / | tail -n 1 | tr -dc '0-9')"
(( disk_used_percent < disk_warning_percent )) || failures+=("disk-${disk_used_percent}-percent")

memory_total_kib="$(awk '/^MemTotal:/ {print $2}' /proc/meminfo)"
memory_available_kib="$(awk '/^MemAvailable:/ {print $2}' /proc/meminfo)"
memory_available_percent="$((memory_available_kib * 100 / memory_total_kib))"
(( memory_available_percent >= memory_warning_percent )) || failures+=("memory-${memory_available_percent}-percent-available")

five_xx_state="$state_directory/nginx-5xx.state"
if [[ -f "$access_log" ]]; then
    log_inode="$(stat -c '%i' "$access_log")"
    current_five_xx="$(awk '$0 ~ /" 5[0-9][0-9] / { count++ } END { print count + 0 }' "$access_log")"
    previous_inode=""; previous_five_xx=0
    if [[ -f "$five_xx_state" ]]; then
        read -r previous_inode previous_five_xx < "$five_xx_state" || true
        if [[ "$previous_inode" == "$log_inode" && "$current_five_xx" -ge "$previous_five_xx" ]]; then
            new_five_xx="$((current_five_xx - previous_five_xx))"
        else
            new_five_xx="$current_five_xx"
        fi
    else
        new_five_xx=0
    fi
    printf '%s %s\n' "$log_inode" "$current_five_xx" > "$five_xx_state"
    chmod 600 "$five_xx_state"
    (( new_five_xx < five_xx_warning_count )) || failures+=("new-5xx-${new_five_xx}")
fi

if (( ${#failures[@]} )); then
    summary="$(IFS=,; echo "${failures[*]}")"
    echo "Operations health check failed: $summary" >&2
    exit 1
fi

echo "SignalRate operations health passed: origin HTTP 200, services healthy, disk ${disk_used_percent}% used, memory ${memory_available_percent}% available."
