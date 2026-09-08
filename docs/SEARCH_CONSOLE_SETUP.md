# Search Console setup

Search Console is not needed for local development.

Technical readiness was verified against production on 8 September 2026: robots and the 434-URL canonical sitemap return 200, representative indexable templates have correct canonicals, and no localhost references were found. A Google verification TXT record is not yet present, so the owner actions below remain pending. See `INDEXING_BASELINE.md`.

- [ ] Add `signal-rate.com` as a Domain property and complete DNS verification with the exact token Google supplies.
- [ ] Confirm HTTPS, apex canonical URLs, and the `www` redirect before submitting anything.
- [ ] Submit `https://signal-rate.com/sitemap.xml`.
- [ ] Inspect the homepage, representative tool, country, MCC/MNC, carrier, network, developer, and error pages.
- [ ] Confirm intentionally noindex pages are excluded, not blocked in a way that prevents Google seeing their robots directive.
- [ ] Monitor Page indexing for duplicates, soft 404s, crawled-not-indexed pages, and unexpected server errors.
- [ ] Review Core Web Vitals by template and real-device traffic; optimize based on field data rather than invented scores.
- [ ] Check Manual actions and Security issues after launch and after material deployments.
- [ ] Re-run the local inventory and link audit before sitemap-affecting releases.

Do not request indexing for empty mobile-plan markets or weak/unverified telecom records.
