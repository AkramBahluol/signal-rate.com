# Consent, advertising, and analytics readiness

## Current state

Advertising and analytics are disabled by default. No AdSense advertising script, tracking pixel, personalized-ad request, ad unit, or consent banner is shipped. Disabled ad slots render nothing and reserve no misleading blank space. Browser-local tools do not send their input to the backend.

The global HTML head includes the operator-supplied `google-adsense-account` meta tag solely for AdSense site-ownership verification. This public verification metadata does not enable ads, load `adsbygoogle.js`, create ad units, enable Auto Ads, or change analytics. `NEXT_PUBLIC_ADSENSE_ENABLED` remains `false`, and `/ads.txt` retains its disabled behavior until a separately reviewed activation requires a valid seller record.

Configuration switches:

- `NEXT_PUBLIC_ADSENSE_ENABLED=false`
- `NEXT_PUBLIC_ADSENSE_CLIENT=`
- `NEXT_PUBLIC_ANALYTICS_ENABLED=false`
- `ADS_TXT_LINE=`

Setting a client identifier alone does not load ads; implementation and an explicit reviewed activation are both required. `/ads.txt` returns 404 unless a correctly shaped real Google seller line is supplied. No fake identifier belongs in source control.

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
