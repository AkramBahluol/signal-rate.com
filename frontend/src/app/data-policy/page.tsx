import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, PolicySection } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Telecom Data Policy",
  description: "How SignalRate obtains, verifies, labels, updates, and corrects telecom reference data.",
  alternates: { canonical: "/data-policy" },
};

export default function Page() {
  return <LegalPage title="Telecom data policy" intro="SignalRate publishes telecom reference data only when its source and review state can be shown honestly.">
    <PolicySection title="Provenance required"><p>Imported telecom records retain a source name, source URL, verification timestamp, and verification status. We prefer regulators, standards bodies, registries, and operator-published material whose reuse can be reviewed.</p></PolicySection>
    <PolicySection title="Verification labels"><p>Verified records were checked against the cited source. Unverified or stale records are labelled as such and are never described as confirmed current data. Conflicts remain visible for review instead of being silently overwritten.</p></PolicySection>
    <PolicySection title="Changes and removals"><p>Imports are idempotent and preserve an audit trail. A single missing observation does not delete a carrier, assignment, or plan. Repeated absence can change publication status while retaining history for investigation.</p></PolicySection>
    <PolicySection title="Coverage limits"><p>Coverage expands source by source. SignalRate does not fill gaps by guessing carrier capabilities, plan availability, network ownership, or current prices. Empty states are preferable to fabricated records.</p></PolicySection>
    <PolicySection title="Corrections"><p>To report a problem, use the <Link className="font-semibold text-blue-700 underline" href="/contact">contact channel</Link> and include the affected URL plus an authoritative source. See the broader <Link className="font-semibold text-blue-700 underline" href="/methodology">methodology</Link> for domain-specific limits.</p></PolicySection>
  </LegalPage>;
}
