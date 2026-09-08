# SignalRate implementation status

## Completed
- Docker Compose: Next.js, Laravel, PostgreSQL, Redis, persistent volumes, health checks.
- Docker stabilization (2026-09-06): Redis no longer publishes host port 6379; Laravel reaches it privately as `redis:6379`. The backend dependency volume and PHP 8.4 image keep locked dependencies available inside the container.
- Responsive SignalRate homepage, shared navigation, tool directory, metadata, robots, sitemap, and tool schema.
- SMS Character Counter: GSM-7 basic/extension handling, Unicode detection, segment limits, remaining capacity.
- Laravel v1 SMS API and unit tests.
- PostgreSQL foundation migration for telecom data, plans/history, errors, tools, guides, and datasets.
- Milestone 2 SMS suite: Character Counter, GSM-7 Checker, Segment Calculator, and Unicode Checker share one analyzer in each application layer. Unicode segmentation counts UTF-16/UCS-2 units correctly for emoji.
- E.164 formatter UI and `POST /api/v1/e164/format`, backed by libphonenumber metadata with country, calling-code, punctuation, `+`, and `00` normalization support.
- Country and calling-code directories with SSR detail pages and versioned APIs.
- MCC/MNC lookup and carrier directory foundations, including exact/search APIs, source provenance, verification state, and honest empty states where no sourced records exist.
- Keyboard-friendly global search (`/` focuses the header field) across tools, countries, calling codes, MCC/MNC records, and carriers.
- SEO additions: canonical metadata, dynamic detail metadata, breadcrumbs, expanded sitemap, SoftwareApplication schemas, and global WebSite/SearchAction schema.
- Clean country import architecture using `App\\Services\\Import\\CountryImporter` and `database/data/countries.json`. Bundled reference rows are deliberately marked `unverified` until independently refreshed.

## Milestone 3 mobile plan comparison
- Added a global country/operator mobile-plan model with UK-first public routes, source-aware finder filters, objective rankings, 2–4 plan comparison, detail pages, price-history presentation, and explicit empty states.
- The production schema now includes `mobile_plans`, `plan_prices`, `plan_price_history`, `plan_features`, `plan_sources`, `plan_source_snapshots`, `plan_verifications`, and `plan_changes`. Query indexes cover country, operator, status, price, allowance, 5G, eSIM, and plan type.
- Ingestion follows Source → adapter → immutable raw snapshot → canonical normalizer/validation → transactional upsert → price/change history. `plans:import-source {source}` loads the adapter configured on `plan_sources`; identical snapshot checksums are idempotent.
- Change tracking covers new plans, price changes, feature changes, disappearance, and return. One missing observation never deletes or deactivates a plan; two consecutive missing snapshots move it to inactive while retaining history.
- Plan data quality uses `verified`, `stale`, `unverified`, and `failed`. Cards and details expose the status and checked date; only verified detail URLs can enter the sitemap or be indexable.
- Global search includes mobile plans with carrier and country context.
- No production UK carrier or plan rows were created. The live pages show honest empty states until a real, permitted, traceable source is configured. Automated examples exist only in refreshed test databases.

### Mobile plan API
- `GET /api/v1/mobile-plans`
- `GET /api/v1/mobile-plans/{id}`
- `GET /api/v1/mobile-plans/country/{iso2}`
- `GET /api/v1/mobile-plans/country/{iso2}/operator/{operator}`
- `GET /api/v1/mobile-plans/search`
- Filters: `country`, `operator`, `price_min`, `price_max`, `data_min` (GB), `unlimited`, `5g`, `esim`, `plan_type`, `contract_length`, and objective `sort`.

### Mobile plan architecture
- The backend plan query service centralizes filtering and rankings; the metrics service owns finite cost-per-GB and total-contract-cost calculations.
- The ingestion namespace separates HTTP/source adapters, raw snapshots, UK canonical normalization, validation, persistence, and change detection. Each source records its adapter class so carrier-specific implementations remain independent.
- Shared frontend components include `PlanCard`, `PlanTable`, `PlanFilters`, `PlanFeature`, `VerificationBadge`, `PriceDisplay`, `DataAllowance`, `OperatorBadge`, and `CompareButton`.

## Milestone 4 network intelligence
- Added `/network` and live tool pages for What Is My IP, IP lookup, ASN lookup, IP WHOIS/RDAP, reverse DNS, hostname lookup, DNS lookup, safe single-port checks, blacklist checks, subnet calculation, CIDR conversion, and IP classification.
- Added versioned APIs for client IP, IP intelligence, ASN, RDAP, reverse DNS, hostname/DNS records, one-port reachability, blacklist registry checks, subnet/CIDR calculation, and IP classification. Public network routes use 30 requests/minute; port and blacklist operations share an aggressive 5 requests/minute limit.
- Shared backend network services own IPv4/IPv6 normalization, CIDR containment, public/private and special-purpose classification, hostname validation, subnet math, ASN normalization, DNS resolution, cache behavior, and provider-result normalization.
- Provider contracts separate GeoIP, ASN, RDAP, reverse DNS, DNS, and blacklist responsibilities. RDAP follows the official IANA IPv4/IPv6 bootstrap and only permits HTTPS endpoints for ARIN, RIPE NCC, APNIC, LACNIC, and AFRINIC. Responses are size-limited and time-bounded.
- No GeoIP or ASN dataset is fabricated. Those adapters return an explicit unavailable state until a licensed dataset/provider is configured. No blacklist provider is enabled until its terms permit the intended use. RDAP and system DNS/reverse DNS operate when their real upstreams are available.
- The port checker accepts one port only, resolves immediately before connecting, requires stable repeated DNS answers, connects to the validated IP rather than the user hostname, and blocks loopback, RFC1918/private, link-local, reserved, multicast, Docker/internal, and cloud metadata addresses.
- Redis caches provider lookups under SHA-256-derived keys, RDAP bootstrap data, and DNS responses according to bounded record TTLs. The What Is My IP page itself is never globally cached, preventing one visitor’s result from being rendered to another.
- Network tools do not create lookup-history tables or persist visitor queries. IP geolocation is always described as approximate and never as a person or exact-address locator.
- Global search includes IP, DNS, ASN, CIDR, subnet, RDAP/WHOIS, reverse-DNS, port, blacklist, and classification tools.
- All network tool pages include canonical metadata, OpenGraph metadata, BreadcrumbList and SoftwareApplication structured data, explanations, privacy notices, related-tool flows, and responsive overflow-safe result layouts. Arbitrary user IP result URLs are not indexable; future `/network/asn/{asn}` pages return 404/noindex unless a provider supplies meaningful data.

### Trusted proxy configuration
- Laravel trusts forwarded client-IP headers only when the immediate proxy appears in `NETWORK_TRUSTED_PROXIES`. The value is a comma-separated list of exact proxy IPs or CIDRs controlled by the deployment.
- Keep this value empty for direct local development. For Nginx/load balancers, add only their real egress addresses. For Cloudflare, maintain Cloudflare’s published IPv4/IPv6 ranges through deployment configuration and update them when Cloudflare changes its list.
- Never configure `*`, arbitrary internet ranges, or client-supplied proxy values. Cloudflare/Nginx must overwrite incoming forwarding headers before forwarding to Laravel. With no trusted proxy match, spoofed `X-Forwarded-For` is ignored and the socket peer address is used.

### Network provider and privacy configuration
- `NETWORK_PROVIDER_TIMEOUT`, `NETWORK_SOCKET_TIMEOUT`, `NETWORK_MAX_RESPONSE_BYTES`, and `NETWORK_LOOKUP_CACHE_SECONDS` bound external work. Provider failures normalize to unavailable/error responses without leaking exception details or inventing fallback values.
- Lookup inputs are not stored in PostgreSQL. Application/infrastructure access-log retention and IP anonymization should be configured at the reverse proxy according to the production privacy policy.
- Network metadata cache keys hash IP addresses rather than embedding the full address. Cache entries are operational and temporary, not user histories.

## Milestone 5 developer tools platform
- Added `/developer-tools` with active routes for JSON Formatter, JSON Validator, Base64/Base64URL, JWT Decoder, UUID Generator, UUID Validator, Unix Timestamp Converter, URL Encoder/Decoder, SHA-256/384/512 Hash Generator, HTML Entity Encoder/Decoder, Text Diff, and Slug Generator.
- All twelve utilities process input entirely in the browser. SignalRate does not send, log, persist, or place pasted JSON, JWTs, plaintext, URLs, HTML, or compared text into analytics events or backend APIs.
- `frontend/src/lib/developer-tools.ts` is the central registry for names, slugs, categories, descriptions, keywords, educational content, status, related tools, directory cards, and sitemap routes.
- `frontend/src/lib/developer-utils.ts` owns reusable, dependency-light logic. JSON formatting changes whitespace without reserializing number/string tokens; Base64 uses UTF-8; UUID v4 uses `crypto.randomUUID`; hashes use Web Crypto; HTML decoding is rendered only as text; Unicode slugs retain non-Latin letters and numbers.
- Input limits protect expensive operations: general developer-tool inputs are capped at 1,000,000 characters, text diff at 200,000 characters and 600 lines per side. No tool evaluates JavaScript, executes code, deserializes unsafe objects, or injects decoded HTML.
- JWT results carry a permanent “Decoded only — signature not verified” warning and expose human-readable `iat`, `exp`, and `nbf` values when numeric. Base64 is labeled encoding rather than encryption, and hash content distinguishes hashing from encryption/password storage.
- Shared `DeveloperToolPage`, input/output, status, copy, clear, example, privacy, related-tool, metadata, breadcrumb, and SoftwareApplication patterns provide responsive, keyboard-friendly layouts with live validation regions and overflow-safe output.
- Global search now covers the requested developer queries with token-order-independent matching. Header/footer navigation, network-to-developer links, related flows, canonical/OpenGraph metadata, structured data, and the sitemap all include the new platform.
- No developer-tool backend APIs were added: there is no operational reason to transmit input that native browser APIs can process safely.

## Milestone 6 error knowledge base
- Added `/errors`, six populated family directories, and source-backed detail routes for HTTP, MySQL, PostgreSQL, SMPP, PHP, and Laravel. The first curated release contains 91 entries: 43 standardized HTTP statuses, 9 MySQL errors, 9 PostgreSQL SQLSTATE conditions, 14 SMPP command statuses, 8 PHP throwable classes, and 8 normalized Laravel failure concepts.
- The normalized schema includes `error_families`, `errors`, `error_aliases`, `error_causes`, `error_solutions`, `error_examples`, `error_sources`, and `error_relations`. The unused Milestone 1 placeholder table is preserved as `legacy_errors` by the reversible migration.
- Every published entry includes an original explanation, diagnosis, causes, fix guidance, a concise safe example, an HTTPS standards/vendor/framework/language source, and a verification date. The importer rejects entries that fail this content/provenance gate. Drafts are excluded from all public results; deprecated entries remain directly accessible with clear noindex labeling but are excluded from lists, search, and sitemap.
- `ErrorNormalizer` owns canonical HTTP, MySQL, PostgreSQL, SMPP, PHP, and Laravel identifiers. PostgreSQL SQLSTATE lookup is case-insensitive; SMPP accepts canonical hex, `0x` hex, and decimal aliases such as `13`, while returning one stable eight-digit hexadecimal code.
- `errors:import` and `ErrorDatasetImporter` provide a transactional, idempotent, source-aware JSON pipeline. Imported rows carry content hashes and are updated safely; rows deliberately marked as manually managed are not overwritten. Manually added relations are preserved.
- Added read-only, rate-limited APIs: `GET /api/v1/error-families`, `GET /api/v1/errors`, `GET /api/v1/errors/search?q=`, and `GET /api/v1/errors/{family}/{code}`. Public catalog/detail responses carry shared-cache headers, and PostgreSQL indexes cover family, canonical code, slug, status, verification state, aliases, and child ordering.
- Error search supports code, family, title, description, symbolic condition, and aliases. Global search now returns labeled error results for phrases such as `mysql 1064`, `postgres duplicate key`, and `smpp bind fail`.
- Error pages include canonical/OpenGraph metadata, breadcrumbs, `CollectionPage` or `TechArticle` structured data, verified source display, related errors, relevant SignalRate tools, copyable diagnostic checklists, responsive code blocks, and keyboard-friendly live search. Only quality-gated published entries enter the sitemap.

## Milestone 7 global telecom data expansion
- Replaced the four-row country example with a controlled 248-country/area dataset generated from the official UN M49 overview. ISO2, ISO3, numeric code, UN name/region provenance, familiar canonical slugs, and active state are imported idempotently. The four previously populated records retain their known currency details; currency remains null elsewhere rather than being inferred from an unsourced mapping.
- Added 241 verified country/calling-code relationships using the official ITU E.164 assigned-code annex and libphonenumber's Apache-2.0 standards-derived country metadata. Generation rejects any library code absent from the official annex. Shared calling codes remain many-to-many through separate country relationships; they are never treated as national mobile prefixes.
- Added the first reviewed MCC/MNC production snapshot: 27 German IMSI assignments from the Bundesnetzagentur list dated 2026-02-24. MCC and MNC are text identifiers; two-digit MNCs such as `01` remain distinct and are tested end to end.
- Added explicit, source-backed operator matching for Telekom Deutschland, Vodafone Germany, and Telefónica Germany/O2, plus verified assignment/legal/brand aliases. No fuzzy merging occurs. Prepaid, postpaid, 4G, 5G, and eSIM remain null because the imported assignment source does not establish those capabilities.
- Added `source_type`, `retrieved_at`, and import-manager provenance to countries, calling codes, operators, and assignments. Standard quality states are `verified`, `unverified`, `stale`, `conflicted`, and `deprecated`; the shared UI now explains each state and shows the source and check date.
- Added `telecom_sources`, bounded compressed `telecom_snapshots`, `mcc_mnc_changes`, `mcc_mnc_conflicts`, and `operator_aliases`. The transaction-safe importer detects new, renamed, status-changed, removed, and reintroduced assignments; one missing observation never removes a row, while two mark it inactive/stale. Cross-source disagreement records a conflict and does not overwrite verified data.
- Added safe commands: `telecom:import-countries`, `telecom:import-calling-codes`, `telecom:import-mcc-mnc`, `telecom:sync`, and `telecom:changes`. Reviewed files are safe to rerun; identical source versions produce no duplicates or new audit events.
- Country, calling-code, MCC, MCC/MNC, carrier, and country-carrier APIs now validate identifiers and paginate collection responses. `GET /api/v1/telecom/search` searches country name/ISO, calling code, MCC, MNC, combined MCC+MNC, assignment, operator, and verified aliases. Existing `/api/v1/search` understands the same telecom patterns.
- Improved directory and detail pages with source/freshness display, useful structured tables, unknown-capability semantics, internal country/code/MCC/operator/tool links, canonical metadata, quality-driven robots rules, and accessible pagination/search. The sitemap includes only verified country/MCC/MNC/carrier pages with enough useful content.
- Source authority, licensing cautions, attribution, raw-snapshot retention, and update procedures are documented in `docs/TELECOM_DATA_SOURCES.md`. Raw ITU/BNetzA publications are not redistributed; accuracy and permitted reuse are prioritized over record count.

## Milestone 8 traffic tools expansion
- Added seven browser-local developer utilities: Regex Tester, five-field UTC Cron Generator/Parser, SQL Formatter, safe YAML Formatter/Validator, JSON↔YAML, CSV↔JSON, and XML↔JSON. Bounded inputs, safe YAML core parsing, bounded aliases, XML entity/DOCTYPE rejection, common catastrophic-regex detection, and explicit no-execution language protect users and the service.
- Added browser-local User-Agent parsing, static QR generation for text/URL/email/phone/SMS/Wi-Fi with selectable size/error correction and SVG download, plus bit/byte data conversion. Heavy parser/formatter/QR dependencies are dynamically imported so common pages do not load them.
- Added `/network/email-security` and SPF, DKIM, and DMARC checkers. They reuse the existing DNS resolver, timeout behavior, and normalized responses; service-record labels with underscores are validated explicitly. Results expose observed records, parsed terms/tags, warnings, and limitations without promising deliverability or security.
- Added SSL certificate, redirect-chain, and HTTP-header diagnostics. The shared public-target guard permits only HTTP/HTTPS, blocks credentials/private/loopback/link-local/reserved/multicast/cloud-metadata/internal targets, resolves twice to detect DNS rebinding, pins cURL to the validated address, and repeats validation for every redirect. Redirects are limited to five and network-facing routes use the existing strict five-per-minute throttle.
- Added local Bandwidth Calculator and Download Time Calculator with correct eight-bit bytes, decimal network units, and explicit real-throughput caveats.
- `frontend/src/lib/developer-tools.ts` and `frontend/src/lib/network-tools.ts` now drive directories, categories, related-tool flows, and sitemap entries. The Laravel `config/tool_catalog.php` catalog supplies global search for all new developer/network terminology. Pages include canonical/OpenGraph metadata, breadcrumbs, SoftwareApplication schema where appropriate, and browser/backend privacy notices.
- No SQL/code execution, private-key processing, mail sending, bulk scanning, tracking QR, AdSense, affiliate, account, or paid-API functionality was introduced.

## Validation
- Milestone 9 final validation (2026-09-08): local and production Compose configurations are valid. All four local containers are running healthy; frontend and backend return HTTP 200, PostgreSQL/Redis are healthy, and Redis remains internal-only with no published host binding.
- Laravel reports no pending migrations and passes 87 tests / 380 assertions. Pint passes across 138 files and Composer strict validation passes.
- Vitest passes 35 tests across five files, including disabled/malformed/configured ads.txt behavior. ESLint passes with zero warnings/errors. The Next.js 16 production build compiles, type-checks, and emits 66 static/dynamic route entries.
- The final local crawl audits 439 public routes: 433 canonical indexable sitemap routes and six intentional noindex routes. It finds zero broken internal links, zero unexpected redirects, zero indexable thin-page flags, and both missing-route/entity probes return 404.
- Live global-search checks pass for telecom, network, developer, error, country, MCC/MNC, carrier, and mobile-plan terms. Robots, sitemap, legal pages, security headers, disabled ads.txt, and safe 404 behavior return the expected statuses.
- A 379 px browser audit covers the homepage and representative telecom tool, error, country, MCC, carrier, network, developer, and mobile-plan templates. No page-level horizontal overflow or unlabelled form control was observed; the mobile header contrast regression found during audit was fixed.
- Production frontend/backend images build successfully under distinct names. The standalone Next container returns HTTP 200, and non-root PHP-FPM starts ready with cURL, PostgreSQL PDO, and Redis enabled. The optimized Docker context is under 1 MB for the frontend instead of the previously observed 550+ MB.

- Milestone 8 final validation (2026-09-08): Compose configuration is valid; migrations report nothing pending; frontend/backend are running and PostgreSQL/Redis are healthy. Redis remains internal-only on `6379/tcp`.
- Laravel passes 87 tests and 380 assertions, including SPF/DKIM/DMARC parsing, selector validation, private/metadata/protocol rejection, redirect behavior and limit, header fixtures, timeout normalization, and DNS-rebinding prevention. Pint passes across 137 files and Composer strict validation passes.
- Vitest passes 32 tests covering regex success/failure, deterministic cron preview, SQL, safe YAML, all three structured-data converters, User-Agent parsing, QR payloads, units, and download estimates. ESLint passes with zero warnings. The Next.js 16 production build compiles, type-checks, and prerenders all required Milestone 8 routes.
- Live page smoke tests return HTTP 200 for all new developer, email-security, web-diagnostic, QR, and calculator routes plus representative Milestones 1–7 routes. Live APIs return normalized DNS observations and reject internal targets as designed.
- Milestone 7 final validation (2026-09-07): Compose configuration is valid; migrations report nothing pending; frontend/backend are running, PostgreSQL and Redis are healthy, and Redis remains internal-only on `6379/tcp`.
- The production-safe telecom sync is idempotent: it reports 248 countries/areas updated with no duplicates, 241 calling-code relationships updated, and all 27 reviewed German assignments unchanged on repeat. The change report retains the original 27 `new` events and reports zero open conflicts.
- Laravel passes 83 tests and 349 assertions. Added coverage verifies country/calling-code import, leading-zero preservation, explicit operator matching, alias search, API pagination/country routes, idempotency, cross-source conflict protection, one/two-snapshot removal behavior, reintroduction, assignment-name changes, and status changes. Pint passes across 131 files and Composer strict validation passes.
- Vitest passes 21 tests, including MCC/MNC query normalization, leading zeros, pagination input, verification/conflict badges, and quality-gated indexing. ESLint passes. The Next.js 16 production build compiles and type-checks 41 generated/static route entries plus all dynamic telecom directories.
- Live HTTP checks return 200 for the homepage, global country/calling-code directories, Germany, +49, the MCC directory, MCC 262, MCC 262/MNC 01, carrier directories, Telekom Germany, the lookup tool, backend health, country-carrier API, and telecom search. The sitemap contains verified Germany, MCC/MNC, and carrier URLs and excludes the empty MCC 999 page; representative thin pages emit `noindex`.
- Milestone 6 final validation (2026-09-07): Docker Compose configuration is valid; migrations report nothing pending; frontend/backend are running, PostgreSQL and Redis are healthy, and Redis remains internal-only on `6379/tcp`.
- Laravel passes 77 tests and 313 assertions, including representative family lookups, normalization, alias/global search, filters, invalid/missing inputs, publication status, provenance, relations, and idempotent/manual-safe imports. Pint passes across 115 files and Composer strict validation passes.
- Vitest passes 17 frontend tests, including error search/filter behavior, canonical code rendering, verified source filtering, and empty states. ESLint passes. The Next.js 16 production build compiles and type-checks the complete application including all error routes.
- Live HTTP checks return 200 for `/errors`, all six family routes, and representative detail pages. Canonical metadata, family/detail APIs, global search examples, and the sitemap were verified; the sitemap contains all 91 published detail URLs plus the six populated family routes.
- Milestone 5 final validation (2026-09-07): `docker compose config` passed and all four containers are running; PostgreSQL and Redis are healthy, with Redis still internal-only on `6379/tcp`.
- Laravel passes 60 tests and 213 assertions, including deterministic global-search coverage for developer-tool queries. Pint passes across 101 files and `composer validate --strict` reports a valid manifest.
- Vitest passes 13 deterministic frontend tests covering valid/invalid/nested JSON, number-token preservation, Base64 Unicode and invalid input, JWT structure, UUID v4 generation/validation, Unix seconds/milliseconds/negative values, Unicode URL encoding and malformed escapes, the SHA-256 `abc` vector, HTML entities, line diff, and Latin/non-Latin slugs.
- Frontend ESLint passes. The Next.js 16 production build compiles and type-checks 42 pages, including the developer directory and all twelve tool pages.
- Live HTTP checks return 200 for `/developer-tools` and every developer-tool page. Canonical metadata, BreadcrumbList/SoftwareApplication schemas, the JWT trust warning, sitemap entries, and all requested global-search phrases were verified against the running services.
- Milestone 4 final validation (2026-09-07): `docker compose config` passed, migrations report nothing pending, and `docker compose ps` shows frontend/backend running with PostgreSQL and Redis healthy. Redis remains internal-only on `6379/tcp`.
- The full Laravel suite passes: 59 tests and 190 assertions, including IP/IPv6 validation and classification, ASN/hostname normalization, CIDR edge cases, provider failure/cache behavior, DNS TTL caching, DNS-rebinding protection, trusted-forwarding behavior, metadata/internal-address blocking, network API contracts, and an explicit assertion that tests use in-memory SQLite/array cache.
- Laravel Pint passes across 101 files and `composer validate --strict` reports a valid manifest.
- Frontend ESLint passes, and the Next.js 16 production build compiles, type-checks, and emits 29 static pages, including the complete Network Intelligence route set.
- Live HTTP checks return 200 for all 13 new network pages plus the existing homepage, tools, countries, and mobile-plan entry points.
- Live API checks pass for client-IP detection, IPv4 lookup, ASN, RDAP, reverse DNS, hostname/DNS lookup, subnet/CIDR/IP calculations, blacklist registry, and global network search. The port checker rejects loopback targets with 422 as designed.
- Live upstream availability remains explicit: reverse DNS and DNS returned real resolver results during validation, and official IANA bootstrap routing produced normalized ARIN RDAP responses for IPv4 and IPv6 checks. The unconfigured blacklist registry truthfully reported zero checked providers.

### Earlier milestone validation history
- Milestone 3 migration applied cleanly to PostgreSQL; the final migration check reports nothing pending.
- Full Laravel suite passes: 31 tests, 82 assertions. New coverage includes plan filters/rankings, metrics, invalid input, global search, raw snapshots, malformed-source rejection, idempotency, price history, disappearance thresholds, return events, and simultaneous feature changes.
- Laravel Pint passes across 73 files and `composer validate --strict` reports a valid manifest.
- Frontend ESLint passes and the Next.js 16 production build compiles, type-checks, and emits all mobile-plan routes.
- Live HTTP checks return 200 for `/mobile-plans`, `/mobile-plans/uk`, `/mobile-plans/uk/find`, `/mobile-plans/uk/compare`, the existing homepage/SMS/country pages, backend health, and plan list/country/filter APIs. Invalid price ranges return 422.
- Final Compose status: frontend/backend running, PostgreSQL and Redis healthy, and Redis remains internal-only on `6379/tcp`.
- `docker compose config` passed.
- `docker compose down` and `docker compose up -d` completed successfully.
- `docker compose ps`: frontend and backend are running; PostgreSQL and Redis are healthy. Redis is internal-only (`6379/tcp`) with no Windows host binding.
- `docker compose exec backend php artisan migrate` passed.
- `docker compose exec backend php artisan test` passed: 5 tests, 8 assertions.
- `http://localhost:8000/up` and `http://localhost:3000` both returned HTTP 200.
- Milestone 2 migrations and country seed import passed against PostgreSQL.
- Laravel test suite: 23 tests passed, 51 assertions.
- SMS boundary coverage includes empty input, 160/161 GSM-7, 70/71 Unicode, extension-table characters, Arabic, emoji, and long multipart messages.
- E.164 tests cover regional formatting, `00` normalization, explicit calling codes, and invalid number lengths.
- Frontend ESLint passed with zero warnings/errors.
- Next.js production build passed; all 21 application routes compiled and type-checked.
- Live API smoke tests passed for SMS, E.164, countries, calling codes, and search. CORS returned `Access-Control-Allow-Origin: http://localhost:3000`.
- Live page checks returned HTTP 200 for all four SMS tools, E.164, MCC/MNC lookup, countries, `/countries/us`, calling codes, `/calling-codes/44`, carriers, and global search.
- Docker Compose config is valid; frontend/backend are running and PostgreSQL/Redis are healthy. Redis remains internal-only.

## Milestone 9 launch and AdSense readiness

- Added a reproducible full-site inventory and internal-link/status crawler. The final local audit covers 439 public routes: 433 indexable/sitemap URLs and six intentional noindex routes, with zero broken internal links, zero unexpected redirects, zero indexable thin-page flags, complete canonical/meta coverage, and explicit 404 probes.
- Rebuilt the homepage as a product landing page, simplified primary navigation, grouped footer discovery, and added About, Contact, Privacy, Terms, and Methodology trust pages. The contact address is environment-configured and no insecure mail relay or form was introduced.
- Completed content, index/noindex, canonical, structured-data, search-intent/cannibalization, internal-linking, placeholder, brand, and future-ad-quality audits. Empty mobile-plan pages remain useful to visitors but are noindex and excluded from the sitemap until approved verified data exists.
- Added a polished searchable 404, safe application error boundary, skip link, focus-visible behavior, and a mobile visual audit across major templates. Fixed a global anchor-color override; 379 px checks found no page-level horizontal overflow or unlabelled form controls in the reviewed templates.
- Added disabled-by-default `AdSlot` and analytics abstractions, safe `/ads.txt` behavior, environment examples, and consent/AdSense documentation. No live ad/analytics script, publisher ID, personalized advertising, affiliate link, or unnecessary consent banner is present.
- Added production security headers with environment-aware development allowances, standalone/non-root Next.js and PHP-FPM images, an internal-only data tier, bounded Redis memory, Nginx apex/www and same-origin API routing, and health checks for frontend/backend/Nginx/PostgreSQL/Redis.
- Added a root Docker build ignore file and distinct production image names. Validated production images directly: standalone Next returned HTTP 200 and non-root PHP-FPM started ready with cURL, PostgreSQL PDO, and Redis extensions.
- Added deployment, Cloudflare/trusted-proxy, firewall, backup/restore, migration/import, logging/retention, monitoring, rollback, launch, Search Console, CMP, and AdSense activation runbooks. Production remains `APP_DEBUG=false`, rate-limited, and secret-free in source control.
- Heavy QR/YAML/XML/CSV/SQL dependencies remain dynamically imported only by the relevant tools. No synthetic Core Web Vitals scores are claimed; production field monitoring is a launch checklist item.

## Current architecture
- `frontend/src/lib/sms.ts` is the single browser-side SMS calculation module; all four SMS pages use `SmsTool`.
- `App\\Services\\Sms\\SmsAnalyzer` is the single API-side SMS calculation service.
- `App\\Services\\Phone\\E164Formatter` owns metadata-backed phone parsing and formatting.
- Directory controllers expose read-only, rate-limited `/api/v1` endpoints; public browser access is limited by CORS to the configured frontend URL.
- Telecom records carry `source_name`, `source_url`, `last_verified_at`, and `verification_status`. UI source notices never label unverified rows as current.

## Milestone 10 production launch (complete)

- Created the `milestone-10-production-launch` branch from verified Milestone 9 commit `501147a` without discarding user work.
- Hardened the production Compose topology with a loopback-only gateway, separate edge/internal-data networks, exact trusted-proxy addressing, bounded resources/PIDs/logs, non-root application images, persistent data/cache volumes, and private PostgreSQL/Redis services.
- Added host Nginx TLS/canonical-host configuration, Cloudflare real-IP range updater, safe commit-tagged deployment orchestration, pre-migration PostgreSQL backups, forward-only approved imports, public smoke verification, rollback guidance, firewall/SSH precautions, disk retention, and restore instructions.
- Added `/data-policy` with canonical metadata and sitemap/footer discovery. Ads and analytics remain disabled by mandatory deployment checks.
- Prepared the assigned Ubuntu 24.04 server at `102.213.181.163`: current-release updates, Docker Engine/Compose, Nginx, UFW, unattended upgrades, key-only hardened SSH, and verified Cloudflare real-IP ranges are installed. Only SSH/HTTP/HTTPS are admitted by the firewall; 443 is intentionally not served before a valid Origin CA certificate exists.
- Deployed release `5fd19510b52b` to `/opt/signalrate`. Standalone Next.js, cached PHP 8.4/Laravel, container Nginx, persistent PostgreSQL 17, and Redis 8 all recover healthy after a host reboot. The gateway is loopback-only and frontend, backend, PostgreSQL, and Redis publish no public host ports.
- Ran forward-only migrations and approved imports on the production database: 248 countries/areas, 241 calling-code relationships, 27 reviewed MCC/MNC assignments, and 91 verified errors. Idempotence checks added no duplicates. Pre- and post-migration custom PostgreSQL backups have validated SHA-256 sidecars; the populated archive has 349 readable entries.
- The real production-origin crawl covered 440 routes (434 indexable and six intentional noindex) with zero broken links or redirects. Representative origin pages/APIs, robots, sitemap, 404 behavior, disabled `ads.txt`, proxy handling, and rate limits passed.
- Public DNS now delegates to Cloudflare, apex and `www` are proxied, and the matching root-only Origin CA certificate is active. Canonical HTTPS returns 200; HTTP and `www` redirect correctly; the full external crawl passes all 440 routes with 434 indexable, six intentional noindex, zero broken links, and zero unexpected redirects. Public smoke/security checks and a 394 px interactive browser check pass.
- Configured the real public address `contact@signal-rate.com` in the protected production environment and rebuilt the frontend. Contact, Privacy, Terms, and Data Policy use only that public address; no private forwarding destination is exposed. Cloudflare email obfuscation remains enabled and its infrastructure paths are excluded from internal-link auditing.
- Final validation: Laravel 88 tests/384 assertions, Pint 139 files, Composer strict validation, frontend 35 tests, ESLint, TypeScript, the 67-entry Next.js production build, production health, public smoke checks, canonical redirects, and the 440-route public crawl all pass. The existing local Milestone 9 Compose environment remains healthy. Encrypted off-host backups and monitoring remain operational follow-up; see `PRODUCTION_LAUNCH_REPORT.md`.

## Milestone 11 post-launch operations (in progress)

- Added a five-minute production health check for public uptime, sitemap integrity, TLS expiry, Docker health/restarts, disk, available memory, and newly observed host-Nginx 5xx responses. Failures enter the systemd journal and an optional generic webhook without tool inputs, request payloads, secrets, or private forwarding data.
- Added daily encrypted restic backup and weekly restore-verification units. The workflow validates the PostgreSQL dump/checksum/archive before upload and restores the latest encrypted snapshot to an isolated temporary path for checksum and archive inspection; it never restores into production.
- Added host-Nginx log rotation and documented the existing 14-day Laravel plus bounded Docker retention. No AdSense or analytics behavior changed.
- Added a reproducible Search Console readiness check and indexing baseline. Production robots, 434 unique canonical sitemap URLs, representative canonicals/indexability, and the external crawl pass. Search-engine discovery queries currently return no results and no Google verification TXT record exists; no indexing or performance data is fabricated.
- A Codex external heartbeat checks public uptime, canonical redirects, representative API/robots/sitemap behavior, and TLS expiry every ten minutes, notifying only on a failure, warning, or recovery.
- Production installation and a real encrypted off-server destination remain to be completed and validated before Milestone 11 can be marked complete.

## Known data state
- The bundled source-reviewed dataset contains 248 UN M49 countries/areas, 241 E.164 calling-code relationships, 27 BNetzA German MCC/MNC assignments, and three explicitly matched German public operator entities. No assignment or carrier capability was invented.
- Global MCC/MNC coverage intentionally remains regulator-by-regulator rather than copying an unlicensed secondary directory or redistributing ITU operational-bulletin data without confirmed reuse rights. Markets without a reviewed permitted source retain honest empty states.

## Remaining after Milestone 7
- Add further national-regulator MCC/MNC snapshots after source access, licence, attribution, and operator-matching review; the current pipeline and audit report are ready for scheduled review-based imports.
- Configure and approve real UK plan sources before publishing records; source terms, retrieval reliability, and mappings must be checked first.
- Configure a licensed GeoIP/ASN dataset and explicitly approved blacklist providers before those optional result fields can become available.
- Continue remaining approved utilities in a later milestone. Code execution, file/image/PDF conversion, eSIM marketplace, internet-plan comparison, affiliate, subscriptions, accounts, paid APIs, AI recommendations, PlanScore, analytics vendors, and AdSense remain out of scope.
- Docker Desktop is required for local development.
