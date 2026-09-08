# SignalRate production launch report

Report date: 8 September 2026.

## Current result

Milestone 10 production launch is complete. SignalRate is publicly reachable at `https://signal-rate.com`, the deployed application is healthy, and all launch-blocking checks pass.

The production source is deployed on `prod.signal-rate.com` (`102.213.181.163`) using commit-tagged images. All five production containers are healthy: container Nginx, standalone Next.js, PHP 8.4/Laravel, PostgreSQL 17, and Redis 8. The private application gateway is bound only to `127.0.0.1:8080`; frontend and backend ports are container-only, and PostgreSQL and Redis have no host bindings.

Public DNS now delegates to Cloudflare nameservers `desi.ns.cloudflare.com` and `henrik.ns.cloudflare.com`; apex and `www` return Cloudflare proxy addresses. Cloudflare reaches the origin successfully using the installed Origin CA certificate, valid from 8 September 2026 through 4 September 2041 and covering `signal-rate.com` plus `*.signal-rate.com`. The certificate and private key match, the key is mode `0600`, and no private material is stored in Git.

Public validation now returns 200 for `https://signal-rate.com/`. Both HTTP hosts redirect to canonical HTTPS, and `https://www.signal-rate.com/` redirects once to `https://signal-rate.com/` without a loop. The reviewed security headers, CSP, HSTS, robots, sitemap, representative API responses, legal/trust pages, disabled `ads.txt`, and 404 behavior pass over the public Cloudflare path.

## Server and security validation

- Ubuntu 24.04 is updated within its current release and boots kernel `6.8.0-139-generic`.
- Docker Engine `29.8.0`, Docker Compose `v5.5.1`, and Ubuntu Nginx `1.24.0` are installed and enabled at boot.
- The non-root `signalrate` deployment user connects with SSH keys and has sudo access. Root login, password login, keyboard-interactive authentication, and X11 forwarding are disabled.
- UFW denies unsolicited inbound traffic by default and permits only SSH, HTTP, and HTTPS. A fresh SSH connection was verified after enabling it.
- The official Cloudflare IPv4/IPv6 proxy ranges are installed in the host Nginx real-IP snippet. Forwarded client addresses are accepted only from those ranges.
- Only ports 22, 80, and 443 are public. Host Nginx terminates the valid Cloudflare Origin CA connection and proxies exclusively to the loopback application gateway. No self-signed certificate or Flexible SSL fallback was introduced.
- Laravel runs in production with debug and display errors disabled, cached configuration/routes/views/events, OPcache enabled, and a non-root `www-data` runtime. Next.js runs as the non-root `signalrate` user.
- At the final resource check, the host had 3.2 GiB available memory and 32 GiB free disk. The five containers used approximately 309 MiB combined and stayed within declared limits.

## Deployment and data validation

The release uses commit-tagged `signalrate/frontend-production` and `signalrate/backend-production` images. The production environment file is mode `0600`, excluded from Git, uses generated secrets, keeps `APP_DEBUG=false`, and keeps ads and analytics disabled. The public contact address is `contact@signal-rate.com`; no private forwarding destination or secret value is included in this report, rendered pages, or repository.

Forward-only migrations completed. The approved idempotent imports produced 248 countries/areas, 241 calling-code relationships, 27 reviewed MCC/MNC assignments, and 91 verified error records. Re-running the imports added no duplicate telecom records, and every migration reports `Ran`.

Same-server PostgreSQL custom-format backups were created before migration, after import, and during the final guarded deployment. They have mode `0600` and matching SHA-256 sidecars. The populated archive structure has 349 readable entries. A destructive restore was not performed against the production database. Encrypted off-server backup storage and a disposable restore destination remain operational follow-up.

The loopback origin and public Cloudflare path returned the expected responses. The final external crawl covered 440 routes: 434 indexable, six intentional noindex, 49 tools, 98 error pages, 285 telecom pages, 22 network pages, 23 developer pages, and four mobile-plan pages. It found zero broken internal links and zero unexpected redirects. A same-host hairpin crawl produced transient ten-second connection timeouts under concurrency, but each reported page returned 200 when tested individually; the authoritative external crawl then passed cleanly.

## Repository validation

- Laravel: 88 tests, 384 assertions, all passing.
- Laravel Pint: 139 files, all passing.
- Composer strict validation: passing.
- Frontend Vitest: 35 tests across five files, all passing.
- ESLint and TypeScript: passing.
- Next.js production build: all 67 route entries compile successfully.
- Local Milestone 9 environment remains healthy; its frontend, backend, PostgreSQL, and internal-only Redis continue to run, and representative frontend/API responses return 200.
- A real browser smoke test at 394 px found no horizontal overflow. The SMS character counter accepted an emoji-bearing message and correctly reported Unicode, 23 characters, and one segment.
- Contact, Privacy, Terms, and Data Policy render only `contact@signal-rate.com` as their public `mailto:` destination. Cloudflare email obfuscation remains enabled, and the audit excludes Cloudflare-owned `/cdn-cgi/` infrastructure paths without suppressing application links.

## Remaining operational follow-up

Milestone 11 added uptime, certificate-expiry, disk, memory, Docker, origin, public-edge, and 5xx monitoring plus log retention and tested restore-verification infrastructure. Off-server encrypted backups are deferred by operator decision and are not a launch or Milestone 11 blocker; the remote restic timers remain installed but safely disabled without a repository.

AdSense and analytics remain disabled. The Search Console Domain property is verified through DNS TXT, and the submitted sitemap reports status **Success** with 434 discovered pages. The indexing report is still processing, so no index or performance totals are claimed.
