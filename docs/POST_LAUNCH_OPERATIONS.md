# SignalRate post-launch operations

This runbook defines the Milestone 11 operations baseline for `https://signal-rate.com`. It does not enable product features, AdSense, or analytics.

## Deployment status

The production host has restic `0.16.4`, the SignalRate systemd units, protected operations configuration, and host-Nginx log rotation installed. `signalrate-health.timer` is enabled and its live check passes with all five containers healthy, 19% disk use, and approximately 78% memory available at the validation point. The synthetic 5xx test detected exactly one newly appended error after establishing its baseline.

The backup workflow was exercised end to end against a temporary restic repository with 100% data-pack verification. It created a live custom-format dump, validated its checksum and 345 archive entries, encrypted it into restic, restored it to an isolated temporary directory, and revalidated the checksum/archive. The temporary repository and password were then removed. Off-server encrypted backups are **deferred by operator decision — not a Milestone 11 blocker**. No paid storage or fabricated remote destination is configured, and both remote-backup timers remain safely disabled.

The active Codex heartbeat `SignalRate production monitor` checks the public edge and, when SSH is available, the host health state every ten minutes. It remains silent while healthy and notifies on failure, warning, or recovery. No server webhook is currently configured.

## Installed checks

`signalrate-health.timer` runs every five minutes and validates:

- the loopback production origin returns 200 with the canonical host;
- the origin sitemap is reachable, canonical, and contains no local origins;
- the installed Origin CA certificate has more than 21 days remaining;
- frontend, backend, Nginx, PostgreSQL, and Redis containers are present, healthy, and have not restarted unexpectedly;
- root disk usage stays below 80%;
- available host memory stays at or above 15%;
- newly observed host-Nginx 5xx responses stay below the alert threshold.

Failures are recorded in the systemd journal and trigger `signalrate-alert@.service`. If `SIGNALRATE_ALERT_WEBHOOK_URL` is configured in the protected operations environment, a generic alert is sent without request content, URLs containing user inputs, IP addresses, credentials, or application payloads. The Codex external heartbeat independently checks the public Cloudflare path and public TLS from outside the server and notifies only on failures or recovery. Separating origin and edge checks avoids false failures when a server cannot hairpin through its own proxy.

Inspect the local monitor with:

```bash
sudo systemctl status signalrate-health.timer signalrate-health.service
sudo journalctl -u signalrate-health.service -u 'signalrate-alert@*' --since today
```

## Backup policy

SignalRate retains its same-server PostgreSQL backup capability and manual process. Run the following from `/opt/signalrate` whenever an on-server snapshot is required:

```bash
./scripts/backup-postgres.sh
sha256sum --check backups/<backup-file>.dump.sha256
docker compose -f docker-compose.prod.yml --env-file .env.production exec -T postgres pg_restore --list < backups/<backup-file>.dump
```

The script writes a PostgreSQL custom-format archive and SHA-256 sidecar under `/opt/signalrate/backups`, uses file mode `0600`, and applies the configured local retention period. The final Milestone 11 validation created and verified a live same-server archive successfully. This protects routine operator workflows but is not represented as protection from total server loss.

### Optional future encrypted off-server backups

SignalRate uses restic because it encrypts and authenticates data before transmission and supports S3-compatible, SFTP, and other remote repositories. `signalrate-backup.timer` creates a custom-format PostgreSQL dump, validates its SHA-256 checksum and archive table, uploads only the dump/checksum pair to restic, checks repository metadata, and retains seven daily, four weekly, and six monthly snapshots.

`signalrate-backup-verify.timer` runs weekly. It checks a sample of encrypted repository data, restores the latest snapshot into a temporary directory, verifies the checksum, and inspects the PostgreSQL archive. It never restores into the production database.

Off-server encrypted backups are deferred by operator decision and are not a launch or Milestone 11 completion blocker. `signalrate-backup.timer` and `signalrate-backup-verify.timer` remain installed but disabled whenever no remote repository is configured. The tested automation remains available so an operator can add a remote repository later without redesigning the backup or restore-verification system.

No Cloudflare R2, S3, SFTP, or other paid storage integration should be enabled under the current policy. If the operator changes that policy later, the optional activation procedure is:

1. Select an operator-owned S3-compatible bucket, SFTP host, or other supported restic backend in a separate failure domain.
2. Put its repository URL and provider credentials in `/etc/signalrate/operations.env` with mode `0600`.
3. Generate a unique restic password, store it at `/etc/signalrate/restic-password` with owner `root:root` and mode `0600`, and keep a recovery copy outside the server. Never place it in Git or chat.
4. Initialize once with `sudo -E restic init` using the protected environment.
5. Re-run `sudo scripts/install-production-operations.sh`; it enables the two backup timers only when both repository and password file are present.
6. Run both services once and confirm the remote snapshot from the storage provider side:

```bash
sudo systemctl start signalrate-backup.service
sudo systemctl start signalrate-backup-verify.service
sudo journalctl -u signalrate-backup.service -u signalrate-backup-verify.service --since today
```

Quarterly, restore a selected snapshot into a disposable PostgreSQL instance and record application-level checks. The automated archive inspection is valuable but is not a substitute for a full disaster-recovery exercise.

## Log retention and privacy

- Host Nginx access logs rotate daily, at 25 MB at the latest, retain 14 compressed rotations, and do not record query bodies or cookies.
- Container JSON logs remain bounded to 10 MB times three files per service.
- Laravel warning logs retain 14 daily files.
- Monitoring and alert payloads contain only check names and host/service state. They do not contain JWTs, SMS/tool contents, phone numbers, lookup targets, private forwarding addresses, secrets, or full client IP logs.

Review disk usage monthly with `df -h /`, `docker system df`, database size, and backup growth. Never automate broad Docker pruning; retain at least one known-good rollback image.

## Search and indexing operations

Run `node scripts/verify-search-readiness.mjs` after releases that affect routing, metadata, robots, or the sitemap. The check validates the public robots file, sitemap origin/uniqueness, and representative canonical/indexable templates.

The Google Search Console Domain property for `signal-rate.com` is verified through the domain name provider using DNS TXT. Keep the verification TXT record in DNS. `https://signal-rate.com/sitemap.xml` has been submitted successfully; Search Console reports status **Success** and 434 discovered pages.

The indexing report is still processing, so no reliable indexed/not-indexed totals or performance metrics are available yet. Record those values only after Search Console supplies them; do not invent impressions, clicks, CTR, average position, indexed counts, Core Web Vitals field data, manual-action status, or security-issue status.

The production browser resource audit found no Google Analytics, Tag Manager, AdSense, DoubleClick, or related tracking/ad requests. Tool inputs remain browser-local unless a tool explicitly requires a documented backend network lookup; no analytics pipeline receives those inputs.
