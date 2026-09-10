#!/usr/bin/env bash
set -Eeuo pipefail

repository_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repository_root"

environment_file="${SIGNALRATE_ENV_FILE:-.env.production}"
[[ -f "$environment_file" ]] || { echo "Missing .env.production. Create it from the example and keep it outside Git." >&2; exit 1; }
[[ -z "$(git status --porcelain)" ]] || { echo "Refusing to deploy a dirty worktree." >&2; exit 1; }

for key in APP_KEY DB_PASSWORD NEXT_PUBLIC_CONTACT_EMAIL; do
    grep -Eq "^${key}=.+" "$environment_file" || { echo "Required production setting is missing: $key" >&2; exit 1; }
done
grep -Eq '^APP_ENV=production$' "$environment_file" || { echo "APP_ENV must be production." >&2; exit 1; }
grep -Eq '^APP_DEBUG=false$' "$environment_file" || { echo "APP_DEBUG must be false." >&2; exit 1; }
grep -Eq '^SITE_URL=https://signal-rate\.com$' "$environment_file" || { echo "SITE_URL must use the canonical HTTPS origin." >&2; exit 1; }
grep -Eq '^NEXT_PUBLIC_ADSENSE_ENABLED=true$' "$environment_file" || { echo "AdSense must be explicitly enabled for this release." >&2; exit 1; }
grep -Eq '^NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-9743834422526607$' "$environment_file" || { echo "The reviewed AdSense client is missing." >&2; exit 1; }
grep -Eq '^ADS_TXT_LINE=google\.com, pub-9743834422526607, DIRECT, f08c47fec0942fa0$' "$environment_file" || { echo "The reviewed Google seller declaration is missing." >&2; exit 1; }
grep -Eq '^NEXT_PUBLIC_ANALYTICS_ENABLED=false$' "$environment_file" || { echo "Analytics must remain disabled until a real reviewed configuration exists." >&2; exit 1; }

chmod 600 "$environment_file"
export SIGNALRATE_RELEASE="$(git rev-parse --short=12 HEAD)"
export SIGNALRATE_ENV_FILE="$environment_file"
compose=(docker compose -f docker-compose.prod.yml --env-file "$environment_file")

deployment_log="${SIGNALRATE_DEPLOYMENT_LOG:-/var/log/signalrate/deployments.json.log}"
deployment_started_at="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
deployment_id="deploy_$(date -u +%Y%m%dT%H%M%SZ)_${SIGNALRATE_RELEASE}"
containers_recreate_started_at=""
healthy_at=""

write_deployment_event() {
    local event="$1" timestamp="$2" status="${3:-}" completed_at="${4:-}"
    if [[ -d "$(dirname "$deployment_log")" && -w "$(dirname "$deployment_log")" ]]; then
        printf '{"timestamp":"%s","deployment_id":"%s","event":"%s","commit":"%s","status":"%s","started_at":"%s","containers_recreate_started_at":"%s","healthy_at":"%s","completed_at":"%s"}\n' \
            "$timestamp" "$deployment_id" "$event" "$SIGNALRATE_RELEASE" "$status" "$deployment_started_at" "$containers_recreate_started_at" "$healthy_at" "$completed_at" >> "$deployment_log"
    else
        echo "Deployment event log is not writable: $deployment_log" >&2
    fi
}

finish_deployment() {
    local exit_code=$? completed_at status
    trap - EXIT
    completed_at="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
    status="failure"
    [[ "$exit_code" == 0 ]] && status="success"
    write_deployment_event completed "$completed_at" "$status" "$completed_at" || true
    exit "$exit_code"
}

trap finish_deployment EXIT
write_deployment_event started "$deployment_started_at"

"${compose[@]}" config --quiet
"${compose[@]}" build
containers_recreate_started_at="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
write_deployment_event containers_recreate_started "$containers_recreate_started_at"
"${compose[@]}" up -d postgres redis

for service in postgres redis; do
    container_id="$("${compose[@]}" ps -q "$service")"
    for attempt in {1..30}; do
        [[ "$(docker inspect --format '{{.State.Health.Status}}' "$container_id")" == healthy ]] && break
        [[ "$attempt" == 30 ]] && { echo "$service did not become healthy." >&2; exit 1; }
        sleep 2
    done
done

SIGNALRATE_ENV_FILE="$environment_file" scripts/backup-postgres.sh
project_name="$("${compose[@]}" config --format json | sed -n 's/^  "name": "\([^"]*\)",$/\1/p' | head -n 1)"
[[ -n "$project_name" ]] || { echo "Unable to resolve the Compose project name." >&2; exit 1; }
backend_image="signalrate/backend-production:$SIGNALRATE_RELEASE"
backend_cli=(docker run --rm --network "${project_name}_data" --env-file "$environment_file" --security-opt no-new-privileges:true --pids-limit 200 --memory 768m --cpus 0.75 "$backend_image")
"${backend_cli[@]}" php artisan migrate --force
"${backend_cli[@]}" php artisan telecom:sync
"${backend_cli[@]}" php artisan errors:import
"${compose[@]}" up -d --remove-orphans

for service in frontend backend nginx postgres redis; do
    container_id="$("${compose[@]}" ps -q "$service")"
    for attempt in {1..45}; do
        [[ "$(docker inspect --format '{{.State.Health.Status}}' "$container_id")" == healthy ]] && break
        [[ "$attempt" == 45 ]] && { echo "$service did not become healthy." >&2; "${compose[@]}" ps; exit 1; }
        sleep 2
    done
done

healthy_at="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
write_deployment_event healthy "$healthy_at"

"${compose[@]}" ps
curl --fail --silent --show-error --header 'Host: signal-rate.com' http://127.0.0.1:8080/ >/dev/null
curl --fail --silent --show-error --header 'Host: signal-rate.com' http://127.0.0.1:8080/api/v1/countries?per_page=1 >/dev/null
echo "Production release $SIGNALRATE_RELEASE is healthy at the local origin."
