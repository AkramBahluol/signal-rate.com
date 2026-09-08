import type { Metadata } from "next";

import { LegalPage, PolicySection } from "@/components/legal-page";
import { PublicContactLink } from "@/components/public-contact-link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How SignalRate handles browser-local tools, network lookups, logs, cookies, consent, and advertising.",
  alternates: { canonical: "/privacy" },
};

export default function Page() {
  return <LegalPage title="Privacy Policy" intro="This policy describes the current SignalRate implementation as of 8 September 2026 and should be reviewed as hosting, advertising settings, and applicable legal requirements change.">
    <PolicySection title="Browser-local tools"><p>Developer formatters, encoders, parsers, QR generation, SMS analysis, and local calculators process entered content in your browser. SignalRate does not intentionally send those inputs to its backend or include them in analytics events.</p></PolicySection>
    <PolicySection title="Network requests and IP addresses"><p>Public DNS, IP, certificate, header, redirect, RDAP, and port tools send the requested target to the backend because the lookup must run from a server. The server also receives the connection IP as part of ordinary HTTP operation. Lookup history is not written to the application database by default.</p></PolicySection>
    <PolicySection title="Logs and retention"><p>Infrastructure may create access and security logs containing time, route, status, user agent, and source IP. Production operators should minimize or anonymize IP data where feasible and use bounded rotation and retention. Application debug mode must be disabled in production.</p></PolicySection>
    <PolicySection title="Advertising, cookies, and consent"><p>SignalRate loads Google AdSense on public pages and permits the Auto Ads behavior configured in the operator&apos;s AdSense account. Depending on region, consent, and Google settings, Google and its approved advertising partners may use cookies or local storage and process device/browser information, IP address, page URL, referrer, and ad interactions for ad delivery, measurement, fraud prevention, and personalization. The Google-certified CMP configured through Google Privacy &amp; messaging manages the applicable choices for visitors in the EEA, United Kingdom, and Switzerland.</p></PolicySection>
    <PolicySection title="Analytics and tool-input isolation"><p>Google Analytics remains disabled. SignalRate does not attach pasted text, JSON, JWTs, phone numbers, SMS content, IP lookup targets, DNS queries, hostnames, or other tool inputs to advertising or analytics events. Network tools may contact DNS resolvers or authoritative public providers described on the relevant result page; that functional request is separate from advertising.</p></PolicySection>
    <PolicySection title="Your choices and contact"><p>You may avoid server-side network tools and use browser-local tools without submitting their content. Requests about access, correction, deletion, or privacy may be sent to <PublicContactLink />; applicable rights depend on jurisdiction and final hosting practices.</p></PolicySection>
  </LegalPage>;
}
