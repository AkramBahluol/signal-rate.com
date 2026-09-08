import type { Metadata } from "next";

import { LegalPage, PolicySection } from "@/components/legal-page";
import { PublicContactLink } from "@/components/public-contact-link";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "Clear terms for using SignalRate tools, reference data, and network diagnostics.",
  alternates: { canonical: "/terms" },
};

export default function Page() {
  return <LegalPage title="Terms of Use" intro="SignalRate provides informational tools and reference material. These launch-readiness terms are plain-language operational guidance and should receive legal review before commercial launch.">
    <PolicySection title="Informational service"><p>Results may be incomplete, delayed, approximate, or affected by third-party systems. Network geolocation is approximate; telecom assignments and plan details can change; formatter output does not replace professional, security, financial, or legal advice.</p></PolicySection>
    <PolicySection title="Independent service"><p>SignalRate is not affiliated with or endorsed by listed carriers, registries, vendors, or standards organizations unless explicitly and verifiably stated. Brand names remain the property of their owners.</p></PolicySection>
    <PolicySection title="Acceptable use"><p>Do not use the service for bulk scanning, disruption, unauthorized access, evasion, abusive automation, or attempts to reach private/internal infrastructure. Network checks are intentionally bounded and may be rate-limited or blocked.</p></PolicySection>
    <PolicySection title="No warranty"><p>The service is provided without a guarantee of availability, exact pricing, deliverability, security, or fitness for a particular purpose. Verify consequential decisions with the authoritative provider.</p></PolicySection>
    <PolicySection title="Contact"><p>Questions about these terms may be sent to <PublicContactLink />.</p></PolicySection>
  </LegalPage>;
}
