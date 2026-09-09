# SignalRate SEO Growth Baseline

Baseline date: 2026-09-09

## Scope and measurement guardrails

Milestone 14 improves the ten existing flagship tools below. It does not add programmatic page families, change product behavior, enable Google Analytics, alter AdSense/CMP configuration, or send tool input to advertising or measurement systems.

No keyword volume, ranking, impression, click, CTR, indexed-page, or revenue result is asserted here. Search Console remains the source of truth once its reports contain enough processed data. Future comparisons should record the exact date range, query/page filter, country/device scope, and whether the figures are final or still processing.

## Flagship search-intent map

| Canonical page | Primary intent | Closely related query cluster |
| --- | --- | --- |
| `/network/speed-test` | internet speed test | download speed test; upload speed test; ping test; internet jitter test |
| `/network/what-is-my-ip` | what is my IP | my IP address; public IP; IPv4 address; IPv6 address |
| `/developer-tools/password-generator` | password generator | strong password generator; random password generator; secure password generator; password maker |
| `/tools/time-zone-converter` | time zone converter | timezone converter; world time converter; convert time zones; meeting time converter |
| `/network/is-it-down` | is it down | website down checker; is website down; site availability checker; check website status |
| `/network/ping-test` | ping test | latency test; internet ping test; jitter test; connection response time |
| `/calculators/percentage-calculator` | percentage calculator | calculate percentage; percentage change; percentage increase; percentage difference |
| `/calculators/currency-converter` | currency converter | exchange-rate calculator; convert currencies; ECB reference rates; currency conversion |
| `/network/ssl-checker` | SSL checker | SSL certificate checker; certificate expiry; TLS checker; HTTPS certificate check |
| `/developer-tools/json-formatter` | JSON formatter | JSON beautifier; pretty-print JSON; JSON validator; minify JSON |

Each page keeps one primary intent. Related phrases appear only where they help explain the tool or answer a real follow-up question; no page repeats keyword blocks.

## Content and internal-link baseline

- The interactive tool remains above the explanatory content. No visitor must read an article before using the tool.
- Every flagship page now has a route-specific title, description, H1, concise introduction, two practical explanation sections, three visible FAQs, and contextual related-tool links.
- Network pages link across connection testing, IP/DNS, availability, and TLS diagnostics. Security-oriented pages connect password, hashing, tokens, and certificate checks. Developer pages connect JSON validation/conversion/diff workflows. Calculator pages connect percentage, finance, units, dates, and data calculations.
- Visible breadcrumbs and `BreadcrumbList` structured data use Home, the correct section, and the current tool. `SoftwareApplication` structured data remains on the tools; visible FAQs are represented by `FAQPage` structured data.
- JSON-LD is serialized server-side and escapes less-than characters. No client SEO injection or new runtime dependency was introduced.

## Multilingual indexability policy

The ten flagship English pages are self-canonical and indexable. Their current prefixed locale variants remain usable, but their important explanatory content is not yet fully translated. Those variants therefore send `noindex, follow`, canonicalize to the English flagship page, are excluded from the sitemap, and are not advertised through hreflang.

This is intentional quality gating, not a redirect or route removal. A locale variant may become indexable only after its metadata, introduction, instructions, explanations, FAQs, privacy/limitations copy, and contextual links are genuinely translated and reviewed. At that point it must receive a self-canonical, reciprocal hreflang, and a sitemap entry together.

Other previously published localized routes retain their existing Milestone 13 behavior; this milestone does not claim that untranslated text is translated.

## Technical SEO audit baseline

- All ten selected routes return HTTP 200 locally, have exactly one expected self-canonical, and expose server-rendered title, description, H1, breadcrumbs, application schema, and FAQ schema.
- False flagship locale alternates were removed. A representative incomplete Arabic flagship route is `noindex, follow`, uses the English canonical, and exposes no false Arabic hreflang.
- The generated sitemap contains 598 unique URLs after removing 54 incomplete flagship locale variants. Every English flagship canonical remains present.
- Static pages and undated collection pages no longer receive a request-time `lastmod`. Source-backed dynamic records retain a real verification/publication date when one exists; an unknown date is omitted instead of replaced with the current time.
- New internal links point only to existing tool routes. The tool implementations, backend APIs, SSRF controls, privacy behavior, AdSense/CMP configuration, and Analytics-disabled state are unchanged.
- No dependency was added. Existing interaction-time loading for the Cloudflare speed test and other heavy tools is preserved, so unrelated routes do not inherit those bundles.

## Ongoing review

Use Search Console page/query reports only after processing is reliable. Compare the flagship page group against an explicitly recorded prior period, and review crawl/indexing exclusions before interpreting traffic changes. Any future content change should be based on observed search intent, user usefulness, and technical correctness—not a fabricated rank or search-volume estimate.

