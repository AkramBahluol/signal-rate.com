#!/usr/bin/env bash
set -Eeuo pipefail

repository_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repository_root"

configuration_file="${SIGNALRATE_OPERATIONS_ENV:-/etc/signalrate/operations.env}"
[[ -f "$configuration_file" ]] || { echo "Missing $configuration_file." >&2; exit 2; }
set -a; source "$configuration_file"; set +a

: "${RESTIC_REPOSITORY:?Set RESTIC_REPOSITORY in the protected operations environment.}"
: "${RESTIC_PASSWORD_FILE:?Set RESTIC_PASSWORD_FILE in the protected operations environment.}"
[[ -r "$RESTIC_PASSWORD_FILE" ]] || { echo "RESTIC_PASSWORD_FILE is not readable." >&2; exit 2; }

backup_directory="${SIGNALRATE_BACKUP_DIR:-$repository_root/backups}"
SIGNALRATE_BACKUP_DIR="$backup_directory" SIGNALRATE_ENV_FILE="${SIGNALRATE_ENV_FILE:-.env.production}" \
    "$repository_root/scripts/backup-postgres.sh"

backup_file="$(find "$backup_directory" -maxdepth 1 -type f -name 'signalrate-postgres-*.dump' | sort | tail -n 1)"
[[ -n "$backup_file" && -s "$backup_file" && -s "$backup_file.sha256" ]] || { echo "No complete backup pair found." >&2; exit 1; }
sha256sum --check "$backup_file.sha256"

toc_entries="$(docker compose -f docker-compose.prod.yml --env-file "${SIGNALRATE_ENV_FILE:-.env.production}" exec -T postgres pg_restore --list < "$backup_file" | grep -vc '^;')"
(( toc_entries > 0 )) || { echo "Backup archive has no readable entries." >&2; exit 1; }

restic backup --tag signalrate --tag postgres "$backup_file" "$backup_file.sha256"
restic snapshots --latest 1 --tag signalrate --tag postgres
restic check
restic forget --tag signalrate --tag postgres --keep-daily 7 --keep-weekly 4 --keep-monthly 6

echo "Encrypted off-server backup completed and repository metadata verified."
