# SignalRate production launch report

Report date: 8 September 2026.

## Current result

Milestone 10 repository preparation is in progress; production is **not live yet**. Public DNS checks for `signal-rate.com` and `www.signal-rate.com` returned NXDOMAIN on 8 September 2026. No production server address, SSH deployment identity/key path, Cloudflare zone access, origin certificate, or real public contact email was available in the working environment. Consequently, no claim of public HTTPS availability, migration execution on a production database, public crawl, or go-live completion is made.

The complete production image topology was validated locally in an isolated Compose project. All five services became healthy; the loopback origin returned 200 for the homepage, data policy, country directory, HTTP 404 knowledge page, robots, sitemap, and API. The local production crawl covered 440 routes (434 indexable, six intentional noindex) with zero broken internal links or unexpected redirects. PostgreSQL and Redis exposed only their container ports and no host bindings. This is origin validation, not a substitute for the pending public HTTPS crawl.

Laravel passes 88 tests and 384 assertions; Pint passes across 139 files and Composer strict validation succeeds. The frontend passes 35 tests and ESLint, and the production Next.js image compiles/type-checks all 67 route entries with telemetry disabled. The production PHP 8.4 image uses the production ini, OPcache, a six-worker FPM ceiling, disabled display errors, and a non-root runtime user. Its Next.js peer also runs as a non-root user.

Representative warm local-origin response times were 4–10 ms for the homepage and browser-local tool pages, 75–87 ms for country/MCC pages, and 218 ms for the HTTP 404 knowledge page. These numbers demonstrate no obvious origin regression but are not public latency or Core Web Vitals. Browser checks exercised the data-policy layout and JSON formatter at 379 px, including example loading and formatting. A same-origin API defect found in the first What Is My IP check was fixed; the rebuilt production client returned a normalized result. Public mobile and field performance validation remain pending DNS/TLS.

Forwarded-client handling was validated with a non-sensitive documentation address: the exact Compose gateway accepted the Nginx-sanitized client header, while the backend remained unpublished. Public directory traffic reports a 60-request Laravel limit; trusted internal frontend rendering reports a separate bounded 3000-request limit so SSR crawling cannot exhaust one global public bucket. Nginx applies an additional per-client public API limit and returns 429 when exceeded.

## Prepared architecture

- Ubuntu host Nginx owns ports 80/443 and forwards only to `127.0.0.1:8080`.
- Cloudflare proxies apex and `www`; Full (strict) validates a real origin certificate stored outside Git.
- Container Nginx is the private gateway to standalone Next.js and PHP-FPM.
- PostgreSQL and Redis live only on an internal Docker network. Neither publishes a host port.
- Laravel trusts only the fixed Compose edge gateway passed through FastCGI. Host Nginx accepts Cloudflare client-IP headers only from Cloudflare's maintained source ranges and overwrites all forwarded headers.
- Runtime limits reserve headroom on a 2-vCPU/4-GB host. Docker JSON logs and Laravel daily logs are bounded.
- PostgreSQL, Redis, backend storage, and backend cache use named volumes; the database is the source of record.

## Automated release behavior

`scripts/deploy-production.sh` refuses an unsafe environment, dirty checkout, debug mode, non-canonical origin, or enabled ads/analytics. It builds commit-tagged images, starts the private data tier, creates a pre-migration PostgreSQL dump, runs forward-only migrations plus approved `telecom:sync` and `errors:import` commands, starts the stack, waits for container health, and checks the loopback origin and API. It never runs destructive migrations, test fixtures, or automatic database rollback.

`scripts/verify-production.sh` checks representative public routes, legal pages, tools, directories, redirects, security headers, local-origin leaks, and disabled `ads.txt`. The full public route inventory is regenerated with `SIGNALRATE_AUDIT_ORIGIN=https://signal-rate.com node scripts/audit-site.mjs` after DNS and TLS are live.

## URLs pending public validation

- `https://signal-rate.com/`
- `https://signal-rate.com/api/v1/countries?per_page=1`
- `https://signal-rate.com/robots.txt`
- `https://signal-rate.com/sitemap.xml`
- `https://signal-rate.com/about`
- `https://signal-rate.com/contact`
- `https://signal-rate.com/privacy`
- `https://signal-rate.com/terms`
- `https://signal-rate.com/data-policy`

## External/manual tasks blocking go-live

1. Provide the Ubuntu server IP/hostname, non-root SSH username, and verified local private-key path or SSH config alias.
2. Add proxied Cloudflare apex and `www` DNS records and provision a valid origin certificate without exposing credentials to Git or logs.
3. Provide a real public contact email and complete jurisdiction-appropriate review of legal pages.
4. Configure encrypted off-host backup storage, uptime/certificate/disk monitoring, and a tested restore destination.
5. Deploy, verify health, run the public crawl and mobile smoke tests, then record exact production results here.

AdSense and analytics remain disabled. Search Console verification must be completed by the domain owner; no verification token has been invented.
