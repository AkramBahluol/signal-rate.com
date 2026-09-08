import type { Metadata } from "next";
import Link from "next/link";
import { Footer, Header } from "@/components/site-chrome";
import { SmsTool } from "@/components/sms-tool";

export const metadata: Metadata = { title: "SMS Character Counter & Segment Calculator", description: "Count SMS characters, identify GSM-7 or Unicode encoding, and calculate multipart segments accurately.", alternates: { canonical: "/tools/sms-character-counter" } };

export default function Page() {
  const schema = { "@context": "https://schema.org", "@type": "SoftwareApplication", name: "SMS Character Counter", applicationCategory: "UtilitiesApplication", operatingSystem: "Web" };
  return <><Header /><main className="shell py-10 sm:py-16"><nav aria-label="Breadcrumb" className="mb-8 text-sm text-slate-500"><Link href="/">Home</Link> / <Link href="/tools">Tools</Link> / SMS character counter</nav><div className="mx-auto max-w-4xl"><p className="text-sm font-bold uppercase tracking-[.18em] text-[#315efb]">Telecom tool</p><h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">SMS Character Counter</h1><p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">Accurately count characters and SMS segments. We account for GSM-7 extension characters, Unicode, and concatenated-message limits.</p><div className="mt-9"><SmsTool /></div><section className="mt-12 grid gap-7 md:grid-cols-2"><article><h2 className="text-xl font-bold">How SMS limits work</h2><p className="mt-3 leading-7 text-slate-600">A GSM-7 message holds 160 septets. Extension-table characters such as the euro sign count as two septets. Longer messages use a concatenation header, leaving 153 septets per segment.</p></article><article><h2 className="text-xl font-bold">When Unicode applies</h2><p className="mt-3 leading-7 text-slate-600">Arabic, emoji, and many accented or non-Latin characters require UCS-2. A single Unicode SMS holds 70 characters; multipart messages hold 67 per segment.</p></article></section></div></main><Footer /><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} /></>;
}
