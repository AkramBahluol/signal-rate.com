# Consent, advertising, and analytics readiness

## Current state

The production AdSense loader is enabled through one `next/script` instance in the root layout. It permits the Auto Ads behavior configured by the operator in AdSense, but SignalRate does not yet add manual ad units or claim that ads are serving. Google Analytics remains disabled. Browser-local tools do not send their input to the backend or attach it to advertising events.

The global HTML head retains the operator-supplied `google-adsense-account` ownership meta tag and loads `adsbygoogle.js` once when the reviewed environment values are present. Production `/ads.txt` publishes Google's standard DIRECT seller declaration for the verified publisher ID. Google's account-side Privacy & messaging CMP configuration remains authoritative; SignalRate does not implement a competing custom CMP.

Configuration switches:

- `NEXT_PUBLIC_ADSENSE_ENABLED=true` in production (`false` by default elsewhere)
- `NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-9743834422526607` in production
- `NEXT_PUBLIC_ANALYTICS_ENABLED=false`
- `ADS_TXT_LINE=google.com, pub-9743834422526607, DIRECT, f08c47fec0942fa0` in production

The loader remains off in development and tests unless both AdSense variables are explicitly configured. `/ads.txt` returns 404 unless a correctly shaped real Google seller line is supplied. No secret or tool input is included in either configuration.

## Before advertising is enabled

1. Complete a privacy/legal review for the actual countries served and update `/privacy` to name the chosen vendors, purposes, cookies, retention, and user controls.
2. Select a Google-certified CMP that supports the IAB Transparency and Consent Framework for the EEA, United Kingdom, and Switzerland. Do not replace this with a home-made “accept” banner.
3. Configure region-aware behavior so advertising storage and personalization do not occur before the required consent signal. Define how refusal and withdrawal propagate.
4. Configure Google Consent Mode only through the reviewed CMP. Default consent states must match the legal basis and region; consent must not be inferred from continued browsing.
5. Treat analytics consent separately where required. Analytics must remain functional with denial by staying disabled or using an approved cookieless mode.
6. Expand the production CSP only for the exact Google/CMP domains documented by those vendors. Test report-only first, then enforce.
7. Add ads only after useful content/results, never inside controls, over results, beside lookalike buttons, or in navigation.

## Analytics data contract

The current abstraction permits only `page_view`, `tool_opened`, `tool_used`, `copy_clicked`, and `comparison_used`. Event properties may describe the tool/page category but must never include pasted JSON, JWTs, text, phone numbers, IP addresses, hostnames, lookup targets, query payloads, or raw error input. Any vendor integration requires a new privacy and consent review.
