# SEO keyword and intent map

This map assigns one primary intent to each current page family. It does not claim search-volume data. Titles and H1s should preserve these distinctions; related pages should link to one another without copying the same explanation.

| Page or family | Primary query theme | Intent | Distinction |
|---|---|---|---|
| `/tools/sms-character-counter` | SMS character counter | Tool | Count encoding units and remaining capacity while typing. |
| `/tools/sms-segment-calculator` | SMS segment calculator | Tool | Calculate billing segments and concatenation limits. |
| `/tools/gsm7-checker` | GSM 7 checker | Tool | Identify GSM-7/basic/extension characters and Unicode fallbacks. |
| `/tools/unicode-sms-checker` | Unicode SMS checker | Tool | Explain UCS-2 limits and identify Unicode input. |
| `/tools/e164-phone-formatter` | E.164 phone formatter | Tool | Validate with phone metadata and normalize a supplied number. |
| `/countries`, `/calling-codes` | country calling code lookup | Telecom reference | Browse country metadata versus browse shared calling-code assignments. |
| `/mcc`, `/tools/mcc-mnc-lookup` | MCC MNC lookup | Reference/tool | Directory discovery versus direct multi-field lookup. |
| `/mcc/{mcc}`, `/mcc/{mcc}/{mnc}` | MCC code / MNC operator | Telecom reference | Country network-code group versus one verified assignment. |
| `/carriers/...` | mobile carrier directory | Telecom reference | Source-backed operator entities, not plan recommendations. |
| `/network/what-is-my-ip` | what is my IP | Tool | Detect the request address; does not ask for a target. |
| `/network/ip-lookup` | IP lookup | Tool | Inspect a user-supplied public IP. |
| `/network/asn-lookup` | ASN lookup | Tool | Network ownership/routing lookup by ASN. |
| `/network/ip-whois` | IP WHOIS / RDAP | Tool | Registration and allocation records. |
| `/network/dns-lookup` | DNS lookup | Tool | General record lookup. |
| `/network/spf-checker`, `/network/dkim-checker`, `/network/dmarc-checker` | SPF/DKIM/DMARC checker | Tool | Each targets a distinct email-authentication record and links to the other two. |
| `/developer-tools/json-formatter` | JSON formatter | Tool | Reformat valid JSON without changing tokens. |
| `/developer-tools/json-validator` | JSON validator | Tool | Diagnose syntax validity rather than present formatted output. |
| YAML/CSV/XML conversion pages | structured data converter | Tool | One explicit source-to-target conversion per route. |
| `/developer-tools/jwt-decoder` | JWT decoder | Tool | Decode only; never claims signature verification. |
| `/errors/{family}/{code}` | e.g. MySQL error 1064, HTTP 404 | Troubleshooting | One canonical, sourced error meaning and diagnosis. |
| `/errors/{family}` | HTTP/MySQL/PostgreSQL/SMPP/PHP/Laravel errors | Troubleshooting directory | Family discovery, not a duplicate detail answer. |
| `/methodology` | SignalRate data methodology | Informational/trust | Verification, freshness, provenance, and limitations. |

## Cannibalization review

- SMS tools remain separate because counting, segment cost, GSM-7 compatibility, and Unicode diagnosis are different tasks. Cross-links explain which tool to use next.
- JSON Formatter focuses on normalized presentation; JSON Validator focuses on error detection. Their titles and explanations must retain that split.
- What Is My IP is request-derived; IP Lookup is a supplied-target diagnostic. Neither should use the other's H1.
- The MCC/MNC lookup tool supports search; directory/detail pages provide durable, source-backed reference records.
- Country pages, calling-code pages, MCC pages, and carrier pages share entities but lead with different identifiers. Avoid generic “country telecom” titles on all four.
- Empty mobile-plan market/finder/comparison pages are noindex and excluded from the sitemap until verified plan records support meaningful commercial intent.

Review this map whenever a new route is proposed. A new page needs a distinct user task or reference entity, not merely a keyword variation.
