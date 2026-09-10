#!/usr/bin/env bash
set -Eeuo pipefail

[[ "${EUID}" == 0 ]] || { echo "Run with sudo." >&2; exit 2; }
repository_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
[[ "$repository_root" == /opt/signalrate ]] || { echo "Expected production repository at /opt/signalrate." >&2; exit 2; }

install -d -o root -g root -m 0700 /etc/signalrate /var/lib/signalrate-operations
if [[ ! -f /etc/signalrate/operations.env ]]; then
    install -o root -g root -m 0600 "$repository_root/deploy/operations.env.example" /etc/signalrate/operations.env
fi

chmod 0755 "$repository_root/scripts/notify-operations.sh" \
    "$repository_root/scripts/operations-health.sh" \
    "$repository_root/scripts/backup-offsite.sh" \
    "$repository_root/scripts/verify-offsite-backup.sh"
chmod 0755 "$repository_root/scripts/install-production-observability.sh" \
    "$repository_root/scripts/signalrate-observability.py"
install -o root -g root -m 0644 "$repository_root/deploy/logrotate/signalrate" /etc/logrotate.d/signalrate
install -o root -g root -m 0644 "$repository_root"/deploy/systemd/signalrate-*.service /etc/systemd/system/
install -o root -g root -m 0644 "$repository_root"/deploy/systemd/signalrate-*.timer /etc/systemd/system/

apt-get update
DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends restic

systemctl daemon-reload
systemctl enable --now signalrate-health.timer

if grep -Eq '^RESTIC_REPOSITORY=.+$' /etc/signalrate/operations.env \
    && [[ -s /etc/signalrate/restic-password ]]; then
    systemctl enable --now signalrate-backup.timer signalrate-backup-verify.timer
    echo "Health and encrypted off-server backup timers enabled."
else
    systemctl disable --now signalrate-backup.timer signalrate-backup-verify.timer >/dev/null 2>&1 || true
    echo "Health timer enabled. Backup timers remain disabled until the protected restic destination is configured."
fi

logrotate --debug /etc/logrotate.d/signalrate >/dev/null
systemctl start signalrate-health.service
systemctl show signalrate-health.service --property=Result --property=ExecMainStatus --no-pager
[[ "$(systemctl show signalrate-health.service --property=Result --value)" == success ]] \
    || { journalctl -u signalrate-health.service --since '10 minutes ago' --no-pager; exit 1; }
