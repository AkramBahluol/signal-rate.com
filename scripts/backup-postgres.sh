#!/usr/bin/env bash
set -Eeuo pipefail

repository_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repository_root"

environment_file="${SIGNALRATE_ENV_FILE:-.env.production}"
backup_directory="${SIGNALRATE_BACKUP_DIR:-$repository_root/backups}"
retention_days="${SIGNALRATE_BACKUP_RETENTION_DAYS:-7}"

[[ -f "$environment_file" ]] || { echo "Missing production environment file." >&2; exit 1; }
[[ "$retention_days" =~ ^[0-9]+$ ]] || { echo "Backup retention must be a whole number of days." >&2; exit 1; }

resolved_backup_directory="$(realpath -m "$backup_directory")"
case "$resolved_backup_directory" in
    /|"$repository_root") echo "Unsafe backup directory." >&2; exit 1 ;;
esac

mkdir -p "$resolved_backup_directory"
chmod 700 "$resolved_backup_directory"
timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
backup_file="$resolved_backup_directory/signalrate-postgres-$timestamp.dump"
partial_file="$backup_file.partial"
trap 'rm -f "$partial_file"' EXIT

compose=(docker compose -f docker-compose.prod.yml --env-file "$environment_file")
"${compose[@]}" exec -T postgres sh -c 'pg_dump --format=custom --no-owner --username="$POSTGRES_USER" "$POSTGRES_DB"' > "$partial_file"
[[ -s "$partial_file" ]] || { echo "PostgreSQL produced an empty backup." >&2; exit 1; }
mv "$partial_file" "$backup_file"
chmod 600 "$backup_file"
sha256sum "$backup_file" > "$backup_file.sha256"
chmod 600 "$backup_file.sha256"

find "$resolved_backup_directory" -maxdepth 1 -type f \( -name 'signalrate-postgres-*.dump' -o -name 'signalrate-postgres-*.dump.sha256' \) -mtime "+$retention_days" -delete

echo "Backup created: $backup_file"
echo "Copy this backup to encrypted off-host storage and verify it there."
