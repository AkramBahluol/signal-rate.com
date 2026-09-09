import Link from "next/link";
import { FlagshipSeoContent } from "@/components/flagship-seo-content";
import { InternetSpeedTest } from "@/components/network/speed-test";
import { Footer, Header } from "@/components/site-chrome";
import { flagshipMetadata, flagshipSeoByPath } from "@/lib/flagship-seo";
import { jsonLd } from "@/lib/json-ld";
import { siteUrl } from "@/lib/site";

export const metadata = flagshipMetadata("/network/speed-test");

export default function Page() {
  const url = `${siteUrl}/network/speed-test`;
  const seo = flagshipSeoByPath["/network/speed-test"]!;
  const appSchema = { "@context": "https://schema.org", "@type": "SoftwareApplication", name: seo.heading, applicationCategory: "UtilitiesApplication", operatingSystem: "Web", url, offers: { "@type": "Offer", price: "0", priceCurrency: "USD" } };
  const crumbs = { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: siteUrl }, { "@type": "ListItem", position: 2, name: "Network", item: `${siteUrl}/network` }, { "@type": "ListItem", position: 3, name: seo.heading, item: url }] };
  return <><Header/><main className="shell py-10 sm:py-16"><nav aria-label="Breadcrumb" className="text-sm text-slate-500"><Link href="/">Home</Link> / <Link href="/network">Network</Link> / {seo.heading}</nav><header className="mt-7 max-w-3xl"><p className="text-sm font-bold uppercase tracking-[.18em] text-[#315efb]">Connection testing</p><h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">{seo.heading}</h1><p className="mt-4 text-lg leading-8 text-slate-600">{seo.description}</p></header><InternetSpeedTest/><FlagshipSeoContent path="/network/speed-test"/><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(appSchema) }}/><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(crumbs) }}/></main><Footer/></>;
}
