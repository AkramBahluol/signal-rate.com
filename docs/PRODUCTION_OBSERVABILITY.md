# SignalRate production observability

## Architecture

SignalRate uses inexpensive Nginx-native request measurement and offline reporting. No request writes to PostgreSQL or Redis, no external lookup runs in the request path, and no application middleware performs analytics work.

```text
Cloudflare
  -> host Nginx (creates request ID, trusted-CF filtering, JSON traffic + security logs)
  -> container Nginx (same request ID, gateway/upstream timing)
  -> Next.js or Laravel (X-Request-ID request header / FastCGI parameter)
  -> host response (one X-Request-ID header)

deployment script -> separate deployment event log
root-only offline report -> HMAC client IDs and aggregates
```

The host always creates `sr_` plus Nginx's 32-character cryptographically random request identifier. Arbitrary incoming `X-Request-ID` values are ignored. Container Nginx accepts only that strict shape and forwards it to Next.js as `X-Request-ID` or Laravel as `HTTP_X_REQUEST_ID`. The host removes any upstream response copy and returns one authoritative `X-Request-ID` on every origin-handled response, including errors and redirects.

## Logs and fields

General traffic is JSON Lines at `/var/log/nginx/signalrate-access.json.log`. Each valid JSON object contains:

- timestamp and request ID;
- method, scheme, host, normalized URI path without query string, edge-to-origin HTTP protocol, and status;
- upstream address/status/kind (`frontend`, `backend_api`, `static`, or `nginx`);
- total, connect, header/first-byte, and response durations in milliseconds;
- request and response byte counts;
- trusted Cloudflare Ray and country when genuinely available;
- Cloudflare cache status only if visible at the origin (normally unavailable because Cloudflare adds it after the origin response);
- escaped user agent, heuristic family/device/traffic class, centralized route class, locale, and a query-value-free RSC boolean;
- sanitized request media type plus response Cache-Control and media type.

`client_id` and `referer` are `null` in this general log. Client IDs are derived only by the protected offline report. Referers are deliberately omitted because their query strings can contain user-provided search or tool data.

Container Nginx emits a smaller JSON record to its existing Docker log with the same request ID, route, status, upstream address/status, and measured gateway-to-Next.js/PHP timings. Nginx OSS error logs cannot embed arbitrary variables in their error format, so 502/503/504 correlation uses the structured access entry's request ID, upstream status/address, precise timestamp, and timings alongside the nearby error-log message. No stage absent from Nginx measurements is invented.

## Privacy and trusted client metadata

The general analytics log never stores raw IP addresses, query strings, request or response bodies, Authorization, cookies, Set-Cookie, API keys, JWTs, passwords, generated passwords, PEM/CSR/JSON/SMS/email contents, form data, webhook payloads, or arbitrary headers.

To support repeated-client analysis without publishing IP addresses, `/var/log/nginx/signalrate-security.json.log` stores only timestamp, request ID, and trusted client IP. It is `0600 root:root`, retained for three days, and never consumed by public application code. The operator report joins it by request ID and derives `c_<12 hex>` with HMAC-SHA-256 using `/etc/signalrate/traffic-hmac.key`. That random 256-bit key is generated once during installation, remains `0600 root:root`, and is not stored in Git. Raw IPs are never printed by the report or live view.

Cloudflare headers are accepted only when `$realip_remote_addr` belongs to a published Cloudflare range. The trusted range list is separate from, and refreshed alongside, the existing `set_real_ip_from` list. Direct requests cannot manufacture trusted country/Ray fields by sending Cloudflare-looking headers.

## Classification limits

Route classification is centralized in host-Nginx maps and covers homepage, tools, guides, calculators, network/developer tools, telecom/country/mobile-plan/error/search/API/static/sitemap/robots/legal/ads pages, locale prefixes, and common scanner probes. It avoids enumerating hundreds of generated URLs.

Human/browser, device, automation, crawler, and scanner classification is heuristic unless a trusted infrastructure signal exists. The current Cloudflare plan/configuration does not forward an origin-verifiable bot verdict. Googlebot and Bingbot user agents are therefore recorded as `googlebot_claim_unverified` and `bingbot_claim_unverified`, never as verified bots. No synchronous reverse-DNS verification is performed. Reports describe these as crawler **claims**, not identities.

## Operator commands

Run reports with root access so the HMAC key and short-retention security log can be joined:

```bash
sudo signalrate-traffic-report --hours 1
sudo signalrate-traffic-report --hours 24
sudo signalrate-traffic-report --hours 48
```

The report shows request/client/rate/byte summaries; exact and normalized routes; status families; countries; heuristic traffic/device/client groups; locales; crawler claims; static/RSC/API/HTML distribution; genuinely available cache metadata; average/p50/p90/p95/p99 latency; frontend/backend-gateway latency; slow requests; 404/4xx/5xx details; HMAC top clients; and deployment events.

Trace one retained request:

```bash
sudo signalrate-trace-request sr_0123456789abcdef0123456789abcdef
```

The trace reconstructs only measurable stages from Nginx's completion timestamp and total/connect/header/response durations: accepted, routed, upstream connected, first upstream byte, and response completed. It reports any deployment whose recorded start/completion window contains the request.

Use a privacy-safe terminal live view:

```bash
sudo signalrate-traffic-live
sudo signalrate-traffic-live --lines 10 --no-follow
sudo signalrate-traffic-live --lines 5 --seconds 10
```

It prints status, milliseconds, trusted country when available, heuristic traffic class, normalized path, and request ID. It never dumps queries, bodies, headers, raw IPs, or client-provided tool data.

## Deployment correlation

`scripts/deploy-production.sh` appends JSON deployment events to `/var/log/signalrate/deployments.json.log`: `started`, `containers_recreate_started`, `healthy`, and `completed`. Every record includes the deployment ID, commit, initial timestamp, and known phase timestamps; the final event includes success/failure and completion time. The observability-only installer records the same event shape. It reloads Nginx when the live bind-mounted configuration matches the checkout; if an atomic Git checkout left the running Nginx container attached to the previous file inode, it records `containers_recreate_started`, recreates only that gateway container, waits for its health check, and leaves the frontend, backend, PostgreSQL, and Redis containers untouched.

## Retention and disk estimate

- Existing text access log: 14 daily compressed rotations; its compatibility format records the normalized URI path rather than query strings.
- General JSON traffic: 14 daily compressed rotations, rotating early at 50 MiB.
- Root-only IP/request-ID security join log: three daily compressed rotations, rotating early at 25 MiB.
- Small deployment event log: 26 weekly compressed rotations.

At the recently observed 17,500–25,000 requests/day, an approximately 0.8–1.2 KiB general record is expected to produce roughly 14–30 MiB/day before compression; the three-field security record roughly 2–4 MiB/day. Typical JSON/gzip compression should keep aggregate retention well below one gigabyte, but disk monitoring remains authoritative and logrotate enforces size ceilings.

## Installation and validation

From the clean production checkout:

```bash
sudo scripts/install-production-observability.sh
```

The installer creates the protected key/logs, installs the Cloudflare trust map, host configuration, logrotate policy and commands, validates both Nginx layers, refreshes only the Nginx gateway container when required by a stale bind-mount inode, waits for health, and runs the existing operations health check.

Validation covers JSON parsing, unique request IDs, response propagation, matching container request IDs, normal/API/static/404/network/Arabic traffic, spoofed Googlebot and Cloudflare headers, secret/query/body absence, permissions, rotation, disk health, deployment events, reports, traces, live view, container health and absence of new 5xx.

## Known limitations

- Cloudflare cache outcome is usually added at the edge after the origin has logged the response, so `cf_cache_status` remains unavailable unless Cloudflare explicitly forwards trusted cache metadata in the future.
- Browser-versus-bot and mobile-versus-desktop values are user-agent heuristics. Googlebot/Bingbot claims are not verified identities.
- Host timings cover Cloudflare/peer-to-gateway request handling; container timings cover gateway-to-Next.js/PHP. They are not browser paint metrics or Cloudflare edge timing.
- Next.js and Laravel receive the request ID, but application log processors were not added in this focused change. Nginx correlation is complete; future application-specific error logging may safely include the validated header without logging inputs.
- Reports can only derive HMAC client IDs while the matching three-day security record remains retained.
- Requests satisfied entirely from Cloudflare's edge cache do not reach host Nginx, so they cannot receive a new origin request ID or appear in origin logs. `CF-Ray` remains the available edge trace identifier for those responses; an origin request ID for edge hits would require an explicitly reviewed Cloudflare-side rule or Worker.

## Production output samples

Validated on production on 2026-09-10 UTC. The short observation window below includes deliberate validation requests and must not be interpreted as organic-traffic or business-performance data.

```text
$ sudo signalrate-traffic-report --hours 1
total requests:             379
estimated unique clients:  17
requests/minute:           42.27
status:                    368 x 200, 9 x 404, 2 x 422, 0 x 5xx
latency avg/p50/p90/p95/p99: 20.2 / 13.0 / 29.0 / 46.0 / 124.0 ms

$ sudo signalrate-trace-request sr_04f0146de59460069644af0a9d439158
HTTP: 200 GET /api/v1/countries
Total: 44.0 ms
Route class: api
Traffic class: curl
```

The same generated IDs were observed in host and container JSON for homepage, Laravel API, and 404 requests. All 379 retained host IDs matched `sr_[a-f0-9]{32}` and were unique. A client-supplied ID was ignored. A direct-origin request carrying forged Cloudflare and Googlebot headers retained empty Ray/country fields, recorded the true direct peer only in the root log, and was classified `googlebot_claim_unverified`.

A canary placed in query values, a JSON tool body, Authorization, and Cookie produced zero matches in the structured host logs, compatibility host access log, and current container JSON log. The general log and deployment log are `0640`; the IP join log and HMAC key are `0600 root:root`. JSON parsing, logrotate debug validation, one-/24-hour reports, three representative traces, privacy-safe live output, operations health, and all five container health checks passed. No 5xx occurred in this validation window.
