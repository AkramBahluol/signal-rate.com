#!/usr/bin/env bash
set -Eeuo pipefail

configuration_file="${SIGNALRATE_OPERATIONS_ENV:-/etc/signalrate/operations.env}"
[[ -f "$configuration_file" ]] && { set -a; source "$configuration_file"; set +a; }

event="${1:-operations-check-failed}"
hostname_value="$(hostname --fqdn 2>/dev/null || hostname)"
message="SignalRate ${event} on ${hostname_value}. Inspect the production systemd journal."

logger --tag signalrate-operations --priority user.err -- "$message"

if [[ -n "${SIGNALRATE_ALERT_WEBHOOK_URL:-}" ]]; then
    payload="{\"text\":\"${message}\"}"
    curl --fail --silent --show-error --max-time 15 \
        --header 'Content-Type: application/json' \
        --data-binary "$payload" \
        "$SIGNALRATE_ALERT_WEBHOOK_URL" >/dev/null
else
    echo "$message No external alert webhook is configured." >&2
fi
