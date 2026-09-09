# Production traffic and cache investigation

Investigated on 2026-09-09 against the public Cloudflare path and the production host. The available host access log covered 2026-09-08 11:04 UTC through 2026-09-09 18:46 UTC (about 31 hours), which is the closest reproducible server-side window to the operator's 24-hour Cloudflare overview. Counts below come from that fixed window; they are not presented as Cloudflare analytics totals.

## HTTP 404 analysis

The host log contained 721 HTTP 404 responses: 720 `GET` requests and one `HEAD` request. Its historical format contains timestamp, request, status, response bytes, and user agent, but not referer, client IP, or ASN. Those unavailable fields were not inferred. The updated format adds upstream status and timing for future diagnostics without adding client IP or referer data.

| Rank | Normalized path | Count | Method | Representative user agent / classification |
|---:|---|---:|---|---|
| 1 | `/fetch` | 37 | GET | Claude/other automated fetch probes; D |
| 2 | `/proxy` | 16 | GET | Claude/other automated proxy probes; D |
| 3 | `/.env` | 9 | GET | security scanners; D |
| 4 | `/llms.txt` | 9 | GET | Lighthouse/browser probes; D, optional file not advertised by SignalRate |
| 5 | `/this-route-must-not-exist` | 8 | GET | SignalRate expected-404 validation; D |
| 6 | `/network/asn/999999999` | 8 | GET | SignalRate invalid-entity validation; D |
| 7 | `/ads.txt` | 8 | GET | launch validation while ads.txt was intentionally disabled; E, now 200 |
| 8 | `/favicon.png` | 5 | GET | unreferenced conventional icon guess; B (`/favicon.ico` is the real 200 asset) |
| 9 | `/api/preview` | 3 | GET | automated endpoint probe; D |
| 10 | `/login` | 3 | GET | automated authentication probe; D |

The remaining scanner set is dominated by environment/credential probes, WordPress/PHP paths, generic proxy/fetch endpoints, framework administration paths, guessed JavaScript configuration files, SQL backups, and unrelated vendor endpoints. No fake route or homepage redirect was added for them.

Classification of all 721 responses:

- **A — real broken SignalRate route/link: 0.** The production sitemap/internal-link audit found no current broken internal target. The only sitemap paths seen historically as 404 were `/network/speed-test` twice before its release and `/api` once during a deployment; both now return 200.
- **B — missing static asset: 7.** Five `/favicon.png`, one `/favicon-32x32.png`, and one `/apple-touch-icon.png` requests were unsolicited conventional-name guesses. SignalRate does not link to them and its real `/favicon.ico` returns 200, so adding duplicate assets was not justified.
- **C — old/removed SignalRate URL: 0.** No request could be tied to a genuine retired canonical with a clear replacement, so no 301 redirect was invented.
- **D — bot/scanner or deliberate validation noise: 703.** This includes 16 expected SignalRate 404 probes and 687 automated, exploit-shaped, guessed-endpoint, crawler, or scanner requests.
- **E — historical/otherwise explained: 11.** Eight expected-disabled `/ads.txt` checks, two pre-release speed-test requests, and one deployment-window `/api` response. All three paths currently return 200.

## HTTP 502 analysis

Exactly ten 502 responses occurred, all from 2026-09-09 12:44:37 through 12:45:00 UTC and all `GET` requests:

1. `/network/ip-whois`
2. `/network/tls-version-checker`
3. `/network/https-checker`
4. `/network/port-checker`
5. `/network/ip-blacklist-check`
6. `/network/subnet-calculator`
7. `/network/cidr-calculator`
8. `/network/ip-calculator`
9. `/network/bandwidth-calculator`
10. `/network/download-time-calculator`

For every response, host Nginx recorded `connect() failed (111: Connection refused)` while connecting to `127.0.0.1:8080`. The Docker journal shows Compose stopping/recreating application containers from 12:44:30 and the gateway becoming available again immediately after the cluster. There was no upstream timeout, reset, Laravel exception, PHP-FPM failure, memory-pressure event, or automatic restart. Current containers report zero restarts and healthy status.

The root cause was therefore a historical single-instance Compose deployment/recreation window, not a recurring application defect. A blue/green or multi-instance deployment redesign would be disproportionate to this targeted investigation, so no speculative runtime change was introduced. Configuration-only changes from this investigation can be installed with an Nginx syntax check and reload without recreating application containers.

## Cache audit and change

Before the change:

- Hashed Next.js JavaScript and CSS under `/_next/static/` already returned `Cache-Control: public, max-age=31536000, immutable`; sampled assets produced Cloudflare `HIT` and `MISS` responses as expected.
- The homepage and tool HTML returned `private, no-cache, no-store, max-age=0, must-revalidate` and Cloudflare `DYNAMIC`.
- API responses remained private/no-cache.
- `/robots.txt` returned a four-hour public cache policy.
- `/sitemap.xml` returned `public, max-age=0, must-revalidate` and Cloudflare `DYNAMIC`.
- `/favicon.ico` used a short four-hour public policy.

Only 508 of roughly 25,015 logged requests (about 2.03%) targeted `/_next/static/`. More than 8,100 were dynamic Next.js RSC requests, with heavy automated traffic to pages such as `/ar/search` and `/ar/mobile-plans`. This request mix closely explains the observed Cloudflare hit rate of about 1.92%; raising the percentage by caching HTML, RSC, APIs, or user-dependent network tools would be unsafe.

The sole cache-policy change is an exact-match host-Nginx rule for `/sitemap.xml`. It replaces the application's immediate-revalidation response with a one-hour public browser/origin TTL. The sitemap contains public canonical URLs only, so the bounded staleness is safe and avoids immediate browser/origin revalidation. HTML pages, localized routing, RSC, APIs, search, What Is My IP, speed tests, lookups, currency responses, AdSense, and CMP behavior remain untouched.

After deployment, the public response carried `Cache-Control: max-age=3600`, but two consecutive checks still reported Cloudflare `DYNAMIC`. Edge caching therefore was not claimed or fabricated. A material Cloudflare-edge improvement requires an explicit narrowly scoped Cache Rule: match only URI path equals `/sitemap.xml`, mark it eligible to cache, set edge TTL to one hour, and leave every other path governed by its origin headers. It must not match HTML, `/_next` RSC queries, `/api/*`, search, or network-tool results. No dashboard/API change and no global **Cache Everything** rule was applied in this task.

## Validation record

Post-deployment validation on 2026-09-09 confirmed:

- HTTP 200 for `/`, `/network/speed-test`, `/network/what-is-my-ip`, `/network/is-it-down`, `/developer-tools/json-formatter`, `/calculators/currency-converter`, `/ar/network/speed-test`, robots, sitemap, Contact, Privacy, and Terms.
- one executable AdSense loader and one ownership meta tag with the existing publisher ID. The existing CSP still permits the reviewed AdSense and Funding Choices/CMP hosts; no analytics or tool-input event was added.
- the English homepage canonical, Arabic speed-test self-canonical, and all eleven speed-test alternate links (nine prefixed locales, English, and `x-default`) remain present.
- 667 unique sitemap URLs. A bounded crawl checked all 667 sitemap routes and 927 discovered internal targets with zero broken internal links. One route exceeded the parallel crawl's 20-second timeout and returned 200 immediately when retried alone.
- immutable one-year caching and a Cloudflare `HIT` for a sampled hashed Next.js JavaScript asset.
- intentionally private/no-store HTML and private/no-cache APIs.
- a one-hour host-origin cache policy for `/sitemap.xml`; Cloudflare edge status remains honestly recorded as `DYNAMIC` pending the optional exact-path rule above.
- five healthy production containers, zero restarts, a passing operations-health check, and zero new 5xx after the Nginx configuration reload.

No post-change Cloudflare cache-hit percentage is claimed; that metric requires accumulated real traffic.
