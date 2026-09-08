# AdSense readiness checklist

AdSense is not active. These are readiness steps, not a claim of approval or eligibility.

## Before applying

- [ ] `signal-rate.com` is live over HTTPS and redirects `www` consistently.
- [ ] Original tools, source-backed references, and explanatory content work without requiring ads.
- [ ] Header/footer navigation, About, Contact, Privacy, Terms, and Methodology are accessible.
- [ ] The latest site inventory has no broken internal links, indexable thin pages, or unexpected 5xx responses.
- [ ] Sitemap includes only useful canonical indexable pages; empty and unverified families remain noindex.
- [ ] Privacy and Terms receive appropriate legal review for the launch jurisdiction.
- [ ] There are no fake reviews, endorsements, offers, publisher IDs, or placeholder ad boxes.

## After a real account/site setup

- [ ] Store the real publisher/client ID in deployment secrets, never Git.
- [ ] Complete the provider's current site-verification flow.
- [ ] Set `ADS_TXT_LINE` to the exact account-provided seller record and verify `/ads.txt` over HTTPS.
- [ ] Deploy a Google-certified CMP for required regions as described in `CONSENT_AND_ADS.md`.
- [ ] Update Privacy with actual cookies, vendors, purposes, retention, and choices before requests begin.
- [ ] Add the minimum required CSP origins after report-only testing.
- [ ] Enable and test placements on small and large screens; tools/results remain primary.
- [ ] Confirm no ad request occurs before the applicable consent state.
- [ ] Monitor the AdSense Policy Center, layout stability, performance, and accidental-click risk.

Never fabricate an account-specific ID or assume current provider steps without checking the account UI and official documentation at activation time.
