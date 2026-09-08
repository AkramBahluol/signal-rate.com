# Production deployment runbook

The production template targets Ubuntu 24.04 on approximately 2 vCPU, 4 GB RAM, and 40 GB storage. Local `docker-compose.yml` remains the development environment. Production uses `docker-compose.prod.yml`, internal PostgreSQL/Redis networks, a standalone Next.js image, PHP-FPM, and container Nginx bound only to host loopback port 8080. Host Nginx owns public ports 80/443 and TLS.

## Required operator inputs

Before deployment, the operator must control the server and Cloudflare zone and provide a real public contact email. No credential belongs in Git. Create `.env.production` from `.env.production.example`, fill its blank values, set file mode `0600`, and generate `APP_KEY` securely. The deploy script rejects missing secrets, debug mode, non-canonical URLs, enabled ads, enabled analytics, or a dirty Git checkout without printing secret values.

Keep `NEXT_PUBLIC_API_URL` empty in production so browser tools use the same-origin `/api` gateway. Server-rendered frontend requests use the private runtime value `API_INTERNAL_URL=http://nginx`; this avoids a Cloudflare/DNS round trip without exposing PHP-FPM.

The current production network uses fixed private subnets `172.30.0.0/28` and `172.30.1.0/28` so Laravel can trust only the exact edge gateway address `172.30.0.1` that private Nginx supplies as FastCGI `REMOTE_ADDR`. Confirm these CIDRs do not overlap server/VPN networks before first start. Never set `NETWORK_TRUSTED_PROXIES=*`.

## Deployment outline

1. Patch Ubuntu; install Docker Engine and the Compose plugin from Docker's supported repository.
2. Create a non-root deploy user, restrict SSH to keys, disable password/root login, and enable a firewall allowing SSH only from approved administration addresses. If Cloudflare fronts an internet-facing Nginx port, allow HTTP/HTTPS only from Cloudflare's published ranges; otherwise use a tunnel/private load balancer.
3. Copy `.env.production.example` to `.env.production`, set a generated Laravel `APP_KEY`, unique database password, canonical URLs, contact address, and the exact Compose Nginx proxy address. Keep the file owner-readable only and out of Git.
4. Install the host configuration from `deploy/nginx/signal-rate.com.conf`, provision its referenced certificate/key outside Git, and generate the Cloudflare real-IP include with `sudo scripts/update-cloudflare-ips.sh`.
5. Run `scripts/deploy-production.sh`. It validates configuration, tags images with the release commit, builds, starts the private data tier, takes a pre-migration dump, runs only safe forward migrations and approved reference imports, starts all services, waits for health, and checks the loopback origin.
6. Run `scripts/verify-production.sh`, then `SIGNALRATE_AUDIT_ORIGIN=https://signal-rate.com node scripts/audit-site.mjs` from a machine that resolves the public domain.

The backend entrypoint builds Laravel config, route, event, and view caches after the final container environment is loaded. Never cache configuration on a build host, run test seeders, or use `migrate:fresh`, `db:wipe`, or automatic migration rollback in production.

## Nginx and HTTPS

`docker/nginx/signalrate.conf` is the private application gateway. `deploy/nginx/signal-rate.com.conf` is the public Ubuntu host configuration and redirects both HTTP and HTTPS `www` requests to the apex. Use Cloudflare SSL/TLS **Full (strict)** with a valid Cloudflare Origin CA or public ACME certificate. Certificate material must live under `/etc/ssl/signalrate` (or an operator-reviewed alternative), owned by root, never in the repository. The supplied HSTS max-age is deliberately one day; increase it only after HTTPS operation is proven and do not preload prematurely.

The same-origin `/api/` route reaches PHP-FPM. Nginx limits request bodies and API rates. Static Next assets receive immutable caching from Next; do not cache dynamic APIs at the edge unless the endpoint's headers and privacy behavior have been reviewed.

## Cloudflare and trusted proxies

- Create a proxied apex `A` record to the server IPv4 address. Create proxied `www` as a CNAME to `signal-rate.com`. Add `AAAA` only when IPv6 is correctly routed and firewalled.
- Disable flexible SSL. Do not cache authenticated or API responses by broad wildcard.
- Set SSL/TLS mode to Full (strict), enable Always Use HTTPS, and leave HTML/API cache behavior at the safe default. Cache only versioned `/_next/static/` assets if a custom rule is introduced. Explicitly bypass `/api/*`, `/network/what-is-my-ip*`, search, and any future authenticated/personalized routes.
- Host Nginx accepts `CF-Connecting-IP` only from Cloudflare's published ranges, overwrites forwarded headers, and sends one sanitized client address to the loopback gateway. Laravel trusts only the exact Compose edge gateway passed through FastCGI—never Cloudflare headers directly and never `*`.
- Refresh the real-IP include after Cloudflare range changes using `scripts/update-cloudflare-ips.sh`; the script validates downloaded ranges and reloads Nginx only after `nginx -t` succeeds.
- Use rate limiting/WAF conservatively so normal tool and search usage remains functional.

## Database, backup, and restore

- PostgreSQL and Redis have no host ports in production. Redis is cache/session/queue infrastructure, not the source of record; its 256 MB cap prevents unbounded growth.
- Schedule daily encrypted `pg_dump --format=custom` backups to storage outside the server, keep at least 7 daily and 4 weekly copies initially, and monitor success/storage. Adjust retention to policy and data growth.
- Quarterly, restore a backup into an isolated PostgreSQL instance with `pg_restore --clean --if-exists --no-owner`, run integrity/application smoke tests, and record the result. An untested backup is not a recovery plan.
- Take a verified backup before migrations. Use forward-compatible migrations and retain the prior application image for rollback. Database rollback is a reviewed restore/migration decision, never an automatic `migrate:rollback` on live data.
- Reference imports are idempotent and source-controlled; test fixtures and development seeders are not production commands.

`scripts/backup-postgres.sh` creates a mode-0600 custom-format dump plus SHA-256 file and removes only matching dumps older than the configured local retention inside the validated backup directory. The deployment script invokes it before migration. Copy every successful backup to encrypted off-host storage; a same-server copy is not sufficient.

To restore, first stop application traffic and create a new isolated PostgreSQL instance/database. Verify the checksum, inspect the archive with `pg_restore --list`, then restore with `pg_restore --clean --if-exists --no-owner` into that isolated database. Run migrations only if the target release requires them, validate row counts and representative pages, and switch traffic only after approval. Never test a restore against the live database.

## Logging and privacy

Laravel uses daily warning logs with a 14-day default. Every Compose service uses bounded JSON logs (10 MB × 3); inner Nginx access logs omit client IP and referrer. Alert at 70%/85% disk use and review `docker system df`, volumes, database size, backups, and application logs. Do not run unattended broad Docker pruning. Remove only reviewed unused image tags after a working rollback image exists. Do not log tool input, JWTs, pasted content, phone numbers, lookup targets, credentials, cookies, full request bodies, or unnecessary client IPs. `APP_DEBUG=false` is mandatory.

## Health, monitoring, and rollback

Compose checks frontend HTTP, PHP-FPM configuration/liveness, Nginx's minimal `/health`, PostgreSQL readiness, and Redis PING. The public health response reveals only `ok`; application diagnostics and database details remain private. Monitor public homepage/API latency, container restarts, 5xx rate, CPU, memory, disk, certificate expiry, backup jobs, and sitemap availability.

For application rollback, record the prior commit/release tag before deployment, check out that reviewed commit, export `SIGNALRATE_RELEASE` to its tag, and start its already-built images with the unchanged secret environment. Validate Compose health and public smoke checks before restoring traffic. Do not automatically reverse migrations. If a schema change is incompatible, make a reviewed forward fix or restore the verified pre-migration dump into an isolated database before an approved cutover.

## Firewall and SSH hardening

Publish only host ports 22, 80, and 443. Compose binds its sole host port to `127.0.0.1:8080`; PostgreSQL, Redis, PHP-FPM, and Next.js publish no host ports. This avoids Docker's forwarded-port interaction with UFW for the private services. Restrict 80/443 to maintained Cloudflare source ranges when the site is fully proxied and provide an operator-approved SSH source policy. Verify a non-root sudo user and a working key-authenticated second session before disabling password login or root SSH. Apply unattended security updates using an operator-reviewed reboot window.
