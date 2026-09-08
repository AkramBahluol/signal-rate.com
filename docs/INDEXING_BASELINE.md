# SignalRate indexing baseline

Baseline date: 8 September 2026.

## Technical readiness

- Canonical production origin: `https://signal-rate.com`.
- Public robots file: HTTP 200, permits general search crawling, declares the canonical sitemap, and contains no localhost origin.
- Public sitemap: HTTP 200 with 434 unique canonical HTTPS URLs.
- Sitemap/indexability inventory: 434 indexable sitemap routes and six intentional noindex routes.
- External crawl: 440 routes, zero broken internal links, zero unexpected redirects, and expected 404 behavior.
- Representative homepage, telecom tool, network tool, developer tool, error, country, MCC, About, and Privacy pages return 200 with the expected canonical and no unexpected noindex directive.
- AdSense and analytics remain disabled. No advertising or analytics identifier was invented.

## Discovery baseline

Public web searches for `site:signal-rate.com`, `site:signal-rate.com/tools`, and `site:signal-rate.com/countries` returned no results on the baseline date. This is expected immediately after launch and is not an authoritative Google index count.

The Google Search Console Domain property for `signal-rate.com` is verified through the domain name provider using a DNS TXT record. That verification TXT record must remain in DNS to preserve ownership verification.

`https://signal-rate.com/sitemap.xml` was submitted successfully. Search Console reports sitemap status **Success** and 434 discovered pages, matching the technical sitemap inventory.

The indexing report is still processing and does not yet provide reliable indexed or not-indexed totals. Impressions, clicks, CTR, average position, indexed counts, Core Web Vitals field data, manual-action status, and security-issue status have not been recorded and must not be guessed.

## Next measurement

After Search Console finishes processing and sufficient real data becomes available, record:

- indexed and not-indexed counts with the major exclusion reasons;
- impressions, clicks, CTR, and average position for the first 7- and 28-day windows;
- Core Web Vitals field status by template when sufficient data exists;
- Manual actions and Security issues status.

Review weekly for the first month, then monthly unless a release or incident warrants closer observation. Do not force-index empty mobile-plan markets, search-result pages, or weak/unverified telecom records.
