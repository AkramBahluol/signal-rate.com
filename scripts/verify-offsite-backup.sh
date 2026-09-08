#!/usr/bin/env bash
set -Eeuo pipefail

repository_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repository_root"

configuration_file="${SIGNALRATE_OPERATIONS_ENV:-/etc/signalrate/operations.env}"
[[ -f "$configuration_file" ]] || { echo "Missing $configuration_file." >&2; exit 2; }
set -a; source "$configuration_file"; set +a

: "${RESTIC_REPOSITORY:?Set RESTIC_REPOSITORY in the protected operations environment.}"
: "${RESTIC_PASSWORD_FILE:?Set RESTIC_PASSWORD_FILE in the protected operations environment.}"

restore_directory="$(mktemp -d /var/tmp/signalrate-restore-verify.XXXXXX)"
case "$restore_directory" in /var/tmp/signalrate-restore-verify.*) ;; *) echo "Unsafe restore directory." >&2; exit 2 ;; esac
cleanup() { rm -rf -- "$restore_directory"; }
trap cleanup EXIT

restic check --read-data-subset="${SIGNALRATE_RESTIC_READ_SUBSET:-5%}"
restic restore latest --tag signalrate --tag postgres --target "$restore_directory"

backup_file="$(find "$restore_directory" -type f -name 'signalrate-postgres-*.dump' | sort | tail -n 1)"
[[ -n "$backup_file" && -s "$backup_file" && -s "$backup_file.sha256" ]] || { echo "Restored backup pair is incomplete." >&2; exit 1; }

expected_checksum="$(awk '{print $1}' "$backup_file.sha256")"
actual_checksum="$(sha256sum "$backup_file" | awk '{print $1}')"
[[ "$expected_checksum" == "$actual_checksum" ]] || { echo "Restored backup checksum failed." >&2; exit 1; }

backup_parent="$(dirname "$backup_file")"
backup_name="$(basename "$backup_file")"
toc_entries="$(docker run --rm --volume "$backup_parent:/backup:ro" postgres:17-alpine pg_restore --list "/backup/$backup_name" | grep -vc '^;')"
(( toc_entries > 0 )) || { echo "Restored archive has no readable entries." >&2; exit 1; }

echo "Off-server restore verification passed with $toc_entries archive entries."
