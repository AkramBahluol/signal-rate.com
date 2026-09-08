# AdSense readiness checklist

The production AdSense loader and verified seller declaration are active. This checklist records implementation readiness, not a claim that Google has approved the site or that ads are serving.

## Before applying

- [x] `signal-rate.com` is live over HTTPS and redirects `www` consistently.
- [x] Original tools, source-backed references, and explanatory content work without requiring ads.
- [x] Header/footer navigation, About, Contact, Privacy, Terms, and Methodology are accessible.
- [x] The latest site inventory has no broken internal links, indexable thin pages, or unexpected 5xx responses.
- [x] Sitemap includes only useful canonical indexable pages; empty and unverified families remain noindex.
- [ ] Privacy and Terms receive appropriate legal review for the launch jurisdiction.
- [ ] There are no fake reviews, endorsements, offers, publisher IDs, or placeholder ad boxes.

## After a real account/site setup

- [x] Configure the real public publisher/client ID through the protected production environment.
- [x] Complete the provider's current site-verification flow.
- [x] Set `ADS_TXT_LINE` to the verified standard Google seller record and verify `/ads.txt` over HTTPS.
- [x] Preserve the operator-configured Google Privacy & messaging CMP for required regions as described in `CONSENT_AND_ADS.md`.
- [x] Update Privacy with the active advertising loader, processing purposes, consent, and tool-input isolation.
- [x] Add only the required Google CSP origins and validate the enforced policy.
- [ ] Enable and test placements on small and large screens; tools/results remain primary.
- [ ] Confirm no ad request occurs before the applicable consent state.
- [ ] Monitor the AdSense Policy Center, layout stability, performance, and accidental-click risk.

Never fabricate an account-specific ID or assume current provider steps without checking the account UI and official documentation at activation time.
