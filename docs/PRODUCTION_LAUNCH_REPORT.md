# SignalRate production launch report

Report date: 8 September 2026.

## Current result

Milestone 10 origin deployment is complete and healthy on the assigned Ubuntu server, but the public launch is **not complete**. The application must not be described as live until DNS points at the new origin through Cloudflare and public HTTPS validation succeeds.

The production source is deployed at commit `5fd19510b52b` on `prod.signal-rate.com` (`102.213.181.163`). All five production containers are healthy after a host reboot: container Nginx, standalone Next.js, PHP 8.4/Laravel, PostgreSQL 17, and Redis 8. The private application gateway is bound only to `127.0.0.1:8080`; frontend and backend ports are container-only, and PostgreSQL and Redis have no host bindings.

Public DNS is currently incorrect. On 8 September 2026, both `signal-rate.com` and `www.signal-rate.com` resolved to `52.213.114.86`, while their authoritative nameservers were `suspension1.mydomainprovider.com` and `suspension2.mydomainprovider.com`. Public HTTP did not return a usable SignalRate response and port 443 was unreachable. These records do not point to the deployed server and are not Cloudflare nameservers. No public crawl, TLS success, or final launch claim is therefore made.

## Server and security validation

- Ubuntu 24.04 is updated within its current release and boots kernel `6.8.0-139-generic`.
- Docker Engine `29.8.0`, Docker Compose `v5.5.1`, and Ubuntu Nginx `1.24.0` are installed and enabled at boot.
- The non-root `signalrate` deployment user connects with SSH keys and has sudo access. Root login, password login, keyboard-interactive authentication, and X11 forwarding are disabled.
- UFW denies unsolicited inbound traffic by default and permits only SSH, HTTP, and HTTPS. A fresh SSH connection was verified after enabling it.
- The official Cloudflare IPv4/IPv6 proxy ranges are installed in the host Nginx real-IP snippet. Forwarded client addresses are accepted only from those ranges.
- Only ports 22 and 80 are currently public. Port 443 remains intentionally unconfigured until the real Cloudflare Origin CA certificate is installed. No self-signed certificate or Flexible SSL fallback was introduced.
- Laravel runs in production with debug and display errors disabled, cached configuration/routes/views/events, OPcache enabled, and a non-root `www-data` runtime. Next.js runs as the non-root `signalrate` user.
- At the final resource check, the host had 3.2 GiB available memory and 32 GiB free disk. The five containers used approximately 309 MiB combined and stayed within declared limits.

## Deployment and data validation

The release images are `signalrate/frontend-production:5fd19510b52b` and `signalrate/backend-production:5fd19510b52b`. The production environment file is mode `0600`, excluded from Git, uses generated secrets, keeps `APP_DEBUG=false`, and keeps ads and analytics disabled. No secret value is included in this report or repository.

Forward-only migrations completed. The approved idempotent imports produced 248 countries/areas, 241 calling-code relationships, 27 reviewed MCC/MNC assignments, and 91 verified error records. Re-running the imports added no duplicate telecom records, and every migration reports `Ran`.

Two same-server PostgreSQL custom-format backups were created before and after the migration/import sequence. Both have mode `0600` and matching SHA-256 sidecars. The populated archive is 165,435 bytes with 349 readable archive entries. A destructive restore was not performed against the production database. Encrypted off-server backup storage and a disposable restore destination remain manual launch requirements.

The loopback origin returned the expected 200 responses for representative pages and APIs, a 404 for a missing route and disabled `ads.txt`, a canonical production sitemap, and production robots directives. The origin crawl covered 440 routes: 434 indexable, six intentional noindex, 49 tools, 98 error pages, 285 telecom pages, 22 network pages, 23 developer pages, and four mobile-plan pages. It found zero broken internal links and zero unexpected redirects.

## Repository validation

- Laravel: 88 tests, 384 assertions, all passing.
- Laravel Pint: 139 files, all passing.
- Composer strict validation: passing.
- Frontend Vitest: 35 tests across five files, all passing.
- ESLint and TypeScript: passing.
- Next.js production build: all 67 route entries compile successfully.
- Local Milestone 9 environment remains healthy; its frontend, backend, PostgreSQL, and internal-only Redis continue to run, and representative frontend/API responses return 200.

## Required external actions before final launch

1. Restore or activate the domain if the registrar has suspended it, then replace the current `mydomainprovider.com` suspension nameservers with the exact nameservers assigned by the SignalRate Cloudflare zone.
2. In Cloudflare DNS, create a proxied apex `A` record to `102.213.181.163` and a proxied `www` `CNAME` to `signal-rate.com`. Remove or correct stale records, including `prod`, unless that hostname is intentionally required.
3. Generate a Cloudflare Origin CA PEM certificate covering `signal-rate.com` and `*.signal-rate.com` (or at minimum apex and `www`). Install the certificate and private key directly on the server as `/etc/ssl/signalrate/origin.pem` and `/etc/ssl/signalrate/origin.key`, readable only by root. Do not paste the private key into chat, Git, or logs.
4. Set Cloudflare SSL/TLS encryption mode to **Full (strict)**. Do not use Flexible mode.
5. Provide the real public contact email for the production environment; no placeholder address will be invented.
6. Configure encrypted off-server backups and uptime, certificate-expiry, and disk monitoring, and identify a disposable restore-test destination.

After items 1–5 are ready, install the prepared host TLS vhost, deploy with the guarded production script, run `scripts/verify-production.sh`, run the complete public crawl, verify mobile behavior and redirects, and observe logs after launch. Only then may Milestone 10 receive the requested final completion commit.

AdSense and analytics remain disabled. Search Console verification remains a domain-owner action; no verification token has been invented.
