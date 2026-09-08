# Production deployment runbook

The production template targets Ubuntu 24.04 on approximately 2 vCPU, 4 GB RAM, and 40 GB storage. Local `docker-compose.yml` remains the development environment. Production uses `docker-compose.prod.yml`, internal PostgreSQL/Redis networks, a standalone Next.js image, PHP-FPM, and Nginx bound to loopback port 8080 for an origin proxy/tunnel.

## Deployment outline

1. Patch Ubuntu; install Docker Engine and the Compose plugin from Docker's supported repository.
2. Create a non-root deploy user, restrict SSH to keys, disable password/root login, and enable a firewall allowing SSH only from approved administration addresses. If Cloudflare fronts an internet-facing Nginx port, allow HTTP/HTTPS only from Cloudflare's published ranges; otherwise use a tunnel/private load balancer.
3. Copy `.env.production.example` to `.env.production`, set a generated Laravel `APP_KEY`, unique database password, URLs, and explicit trusted proxies. Keep the file owner-readable only and out of Git.
4. Build with `docker compose -f docker-compose.prod.yml --env-file .env.production build` and validate config before starting.
5. Start PostgreSQL/Redis, run `php artisan migrate --force` once from the exact release image, run only reviewed reference imports, then start the full stack.
6. Warm Laravel configuration/routes/views if used by the release. Never run test seeders or destructive refresh commands in production.
7. Smoke-test `/`, `/up`, `/health`, legal pages, representative tools/directories, `robots.txt`, and `sitemap.xml` through the public hostname.

## Nginx and HTTPS

`docker/nginx/signalrate.conf` serves the apex host and redirects `www`. It expects HTTPS termination at Cloudflare or another controlled edge; no fake certificate paths are included. Use Cloudflare SSL/TLS **Full (strict)** with a valid origin certificate or public ACME certificate. Add HSTS only at the HTTPS terminator after HTTPS and redirects are proven; start with a short max-age and do not preload prematurely.

The same-origin `/api/` route reaches PHP-FPM. Nginx limits request bodies and API rates. Static Next assets receive immutable caching from Next; do not cache dynamic APIs at the edge unless the endpoint's headers and privacy behavior have been reviewed.

## Cloudflare and trusted proxies

- Proxy apex and `www` DNS records; keep the origin IP private where possible.
- Disable flexible SSL. Do not cache authenticated or API responses by broad wildcard.
- Nginx must overwrite incoming forwarding headers. Laravel `NETWORK_TRUSTED_PROXIES` must contain only the immediate proxy/container CIDR or maintained Cloudflare ranges actually reaching it—never `*`.
- Automate Cloudflare IP-range updates or review them during maintenance; do not trust `CF-Connecting-IP` from arbitrary peers.
- Use rate limiting/WAF conservatively so normal tool and search usage remains functional.

## Database, backup, and restore

- PostgreSQL and Redis have no host ports in production. Redis is cache/session/queue infrastructure, not the source of record; its 256 MB cap prevents unbounded growth.
- Schedule daily encrypted `pg_dump --format=custom` backups to storage outside the server, keep at least 7 daily and 4 weekly copies initially, and monitor success/storage. Adjust retention to policy and data growth.
- Quarterly, restore a backup into an isolated PostgreSQL instance with `pg_restore --clean --if-exists --no-owner`, run integrity/application smoke tests, and record the result. An untested backup is not a recovery plan.
- Take a verified backup before migrations. Use forward-compatible migrations and retain the prior application image for rollback. Database rollback is a reviewed restore/migration decision, never an automatic `migrate:rollback` on live data.
- Reference imports are idempotent and source-controlled; test fixtures and development seeders are not production commands.

## Logging and privacy

Use Laravel daily logs at warning level with rotation/retention appropriate to disk (for example 14 days), plus Docker log rotation (`max-size`/`max-file`) configured on the host. Alert before disk exhaustion. Do not log tool input, JWTs, pasted content, phone numbers, lookup targets, credentials, cookies, or full request bodies. Minimize/anonymize access IPs according to the published policy and operational need. `APP_DEBUG=false` is mandatory.

## Health, monitoring, and rollback

Compose checks frontend HTTP, PHP-FPM configuration/liveness, Nginx's minimal `/health`, PostgreSQL readiness, and Redis PING. The public health response reveals only `ok`; application diagnostics and database details remain private. Monitor public homepage/API latency, container restarts, 5xx rate, CPU, memory, disk, certificate expiry, backup jobs, and sitemap availability.

For rollback, stop routing new traffic, redeploy the previous immutable images and environment, and validate health. Restore data only when a migration/data change is incompatible and a reviewed recovery decision is made.
