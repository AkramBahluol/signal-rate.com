#!/usr/bin/env bash
set -Eeuo pipefail

[[ "${EUID}" == 0 ]] || { echo "Run with sudo." >&2; exit 2; }
repository_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
[[ "$repository_root" == /opt/signalrate ]] || { echo "Expected production repository at /opt/signalrate." >&2; exit 2; }
cd "$repository_root"

install -d -o root -g root -m 0700 /etc/signalrate
install -d -o signalrate -g adm -m 0750 /var/log/signalrate

if [[ ! -s /etc/signalrate/traffic-hmac.key ]]; then
    temporary_key="$(mktemp)"
    openssl rand -hex 32 > "$temporary_key"
    install -o root -g root -m 0600 "$temporary_key" /etc/signalrate/traffic-hmac.key
    rm -f "$temporary_key"
fi

[[ -e /var/log/nginx/signalrate-access.json.log ]] || install -o www-data -g adm -m 0640 /dev/null /var/log/nginx/signalrate-access.json.log
[[ -e /var/log/nginx/signalrate-security.json.log ]] || install -o root -g root -m 0600 /dev/null /var/log/nginx/signalrate-security.json.log
[[ -e /var/log/signalrate/deployments.json.log ]] || install -o signalrate -g adm -m 0640 /dev/null /var/log/signalrate/deployments.json.log
chown www-data:adm /var/log/nginx/signalrate-access.json.log
chmod 0640 /var/log/nginx/signalrate-access.json.log
chown root:root /var/log/nginx/signalrate-security.json.log
chmod 0600 /var/log/nginx/signalrate-security.json.log
chown signalrate:adm /var/log/signalrate/deployments.json.log
chmod 0640 /var/log/signalrate/deployments.json.log

deployment_commit="$(git rev-parse HEAD)"
deployment_started_at="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
deployment_id="deploy_$(date -u +%Y%m%dT%H%M%SZ)_${deployment_commit:0:12}"
observability_healthy_at=""
containers_recreate_started_at=""
printf '{"timestamp":"%s","deployment_id":"%s","event":"started","commit":"%s","status":"","started_at":"%s","containers_recreate_started_at":"","healthy_at":"","completed_at":""}\n' \
    "$deployment_started_at" "$deployment_id" "$deployment_commit" "$deployment_started_at" >> /var/log/signalrate/deployments.json.log

finish_install() {
    local exit_code=$? completed_at status
    trap - EXIT
    completed_at="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
    status="failure"
    [[ "$exit_code" == 0 ]] && status="success"
    printf '{"timestamp":"%s","deployment_id":"%s","event":"completed","commit":"%s","status":"%s","started_at":"%s","containers_recreate_started_at":"%s","healthy_at":"%s","completed_at":"%s"}\n' \
        "$completed_at" "$deployment_id" "$deployment_commit" "$status" "$deployment_started_at" "$containers_recreate_started_at" "$observability_healthy_at" "$completed_at" >> /var/log/signalrate/deployments.json.log
    exit "$exit_code"
}
trap finish_install EXIT

install -o root -g root -m 0644 deploy/nginx/cloudflare-trusted-geo.conf /etc/nginx/snippets/cloudflare-trusted-geo.conf
install -o root -g root -m 0644 deploy/nginx/signal-rate.com.conf /etc/nginx/sites-available/signal-rate.com
install -o root -g root -m 0644 deploy/logrotate/signalrate /etc/logrotate.d/signalrate
install -o root -g root -m 0755 scripts/signalrate-observability.py /usr/local/bin/signalrate-traffic-report
install -o root -g root -m 0755 scripts/signalrate-observability.py /usr/local/bin/signalrate-trace-request
install -o root -g root -m 0755 scripts/signalrate-observability.py /usr/local/bin/signalrate-traffic-live

nginx -t
systemctl reload nginx

compose=(docker compose -f docker-compose.prod.yml --env-file .env.production)
host_nginx_hash="$(sha256sum docker/nginx/signalrate.conf | awk '{print $1}')"
container_nginx_hash="$("${compose[@]}" exec -T nginx sha256sum /etc/nginx/conf.d/default.conf | awk '{print $1}')"
if [[ "$host_nginx_hash" != "$container_nginx_hash" ]]; then
    containers_recreate_started_at="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
    printf '{"timestamp":"%s","deployment_id":"%s","event":"containers_recreate_started","commit":"%s","status":"","started_at":"%s","containers_recreate_started_at":"%s","healthy_at":"","completed_at":""}\n' \
        "$containers_recreate_started_at" "$deployment_id" "$deployment_commit" "$deployment_started_at" "$containers_recreate_started_at" >> /var/log/signalrate/deployments.json.log
    "${compose[@]}" up -d --wait --wait-timeout 60 --no-deps --force-recreate nginx
else
    "${compose[@]}" exec -T nginx nginx -s reload
fi
"${compose[@]}" exec -T nginx nginx -t

logrotate --debug /etc/logrotate.d/signalrate >/dev/null
systemctl start signalrate-health.service
[[ "$(systemctl show signalrate-health.service --property=Result --value)" == success ]]
observability_healthy_at="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
printf '{"timestamp":"%s","deployment_id":"%s","event":"healthy","commit":"%s","status":"","started_at":"%s","containers_recreate_started_at":"%s","healthy_at":"%s","completed_at":""}\n' \
    "$observability_healthy_at" "$deployment_id" "$deployment_commit" "$deployment_started_at" "$containers_recreate_started_at" "$observability_healthy_at" >> /var/log/signalrate/deployments.json.log

echo "SignalRate structured observability installed; the Nginx container was recreated only when its bind-mounted configuration was stale."
