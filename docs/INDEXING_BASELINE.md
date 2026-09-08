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

No Google Search Console verification TXT record was detected. Therefore impressions, clicks, submitted-versus-indexed counts, exclusions, Core Web Vitals field data, manual actions, and security-issue status are not yet available. These values must not be guessed.

Search Console property verification and sitemap submission remain owner-side external actions. Technical search readiness is verified, so those account and DNS actions do not block Milestone 11 completion.

## Next operator measurement

After the domain owner verifies the Search Console Domain property and submits the sitemap, record:

- sitemap submitted/read dates and discovered URL count;
- indexed and not-indexed counts with the major exclusion reasons;
- impressions, clicks, CTR, and average position for the first 7- and 28-day windows;
- Core Web Vitals field status by template when sufficient data exists;
- Manual actions and Security issues status.

Review weekly for the first month, then monthly unless a release or incident warrants closer observation. Do not force-index empty mobile-plan markets, search-result pages, or weak/unverified telecom records.
