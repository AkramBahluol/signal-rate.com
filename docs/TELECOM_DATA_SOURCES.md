# SignalRate telecom data source policy

## Authority order

SignalRate treats data as production-verified only when it can be traced to an international standard/registry, a national telecom regulator, an official operator publication, or another competent governmental or institutional authority, in that order. Wikipedia, blogs, SEO directories, crowdsourced lists, and comparison sites may help discover a primary source, but they are not production truth.

Every imported country, calling code, operator, alias, and MCC/MNC assignment carries `source_name`, `source_url`, `source_type`, `retrieved_at`, `last_verified_at`, and `verification_status`. Supported states are `verified`, `unverified`, `stale`, `conflicted`, and `deprecated`. Unknown fields remain null; in particular, a null capability does not mean “unsupported.”

Conflicting verified assignments are retained for review in `mcc_mnc_conflicts`. The importer does not replace the existing value. A record missing from one later snapshot is not deleted; two consecutive missing observations mark it inactive/stale and retain its history.

## Approved sources in the bundled release

| Dataset | Authority and source | Type | Fields used | Licence / use notes | Update process |
| --- | --- | --- | --- | --- | --- |
| Countries and areas | [United Nations Statistics Division M49](https://unstats.un.org/unsd/methodology/m49/overview) | International standard | UN short name, ISO alpha-2/alpha-3, numeric code, region | UN country/area names and codes are used with clear attribution. UN names are not presented as political endorsement. Review the UN site terms before redistributing the raw page. | Download the official overview, run `database/data/generate_countries.php`, review the diff, then run `telecom:import-countries`. |
| Calling codes | [ITU E.164 assigned-country-code annex](https://www.itu.int/dms_pub/itu-t/opb/sp/T-SP-E.164D-2016-PDF-E.pdf) cross-checked through libphonenumber’s standards-derived metadata | International standard | Country calling code relationship | SignalRate does not bundle or republish the ITU PDF. Generation rejects any library country code absent from the official assignment annex. The derived relationship is attributed; current ITU publication terms must be checked before bundling raw ITU material. libphonenumber is Apache-2.0. | Review later ITU Operational Bulletin amendments and current library metadata, extract the official annex temporarily, regenerate the controlled country file, then import. |
| German IMSI assignments | [Bundesnetzagentur assigned IMSI number blocks](https://www.bundesnetzagentur.de/DE/Fachthemen/Telekommunikation/Nummerierung/IMSI/DL/imsi_zugbloecke.pdf?__blob=publicationFile&v=4) | National regulator | MCC, MNC (as text), assignment holder, assignment status | Attribution is displayed as “Source: Bundesnetzagentur.” The raw PDF is not committed. Re-check BNetzA terms before broader redistribution. | Download the current regulator list, normalize into a new reviewed JSON snapshot, compare with `telecom:changes`, then import. |
| German public operator identities | The BNetzA assignment list plus each linked official operator website | Regulator + official operator | Explicit legal-name-to-brand mapping and official website | Matching is curated and explicit. Similar names are never fuzzy-merged. Capability flags remain null because this release does not include a capability source. | Review assignment holder and operator identity together; update aliases only with documentary support. |

The ITU E.212 worldwide operational bulletin is an important discovery and verification source, but SignalRate does not bundle its raw annex in this release because wholesale redistribution rights have not been confirmed. National regulator datasets are added market by market only after source access, licence, and mapping review. Accuracy is intentionally prioritized over row count.

## Snapshot and retention rules

MCC/MNC imports store a SHA-256 content hash, retrieval date, source version, record count, and compressed raw payload in PostgreSQL. Identical snapshots are idempotent. The application retains the 12 newest snapshots per source/dataset; dependent change/conflict audit rows are retained with those snapshots. Production backups and retention must follow the deployment privacy and storage policy.

## Commands

```text
php artisan telecom:import-countries [path]
php artisan telecom:import-calling-codes [path]
php artisan telecom:import-mcc-mnc [path]
php artisan telecom:sync
php artisan telecom:changes [--since=YYYY-MM-DD]
```

Imports use reviewed local files and never poll upstream sources aggressively. Future scheduled retrieval should reflect volatility—typically monthly for stable standards and weekly/monthly for regulator assignments—and must stage a reviewable snapshot before publication.
