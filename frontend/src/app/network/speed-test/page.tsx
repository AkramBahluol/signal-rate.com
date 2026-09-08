import type { Metadata } from "next";
import Link from "next/link";
import { InternetSpeedTest } from "@/components/network/speed-test";
import { Footer, Header } from "@/components/site-chrome";
import { siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Internet Speed Test",
  description: "Measure download speed, upload speed, ping latency, and jitter directly between your browser and Cloudflare.",
  alternates: { canonical: "/network/speed-test" },
  openGraph: {
    title: "Internet Speed Test | SignalRate",
    description: "Run a private, browser-initiated connection test against Cloudflare's edge.",
    url: "/network/speed-test",
  },
};

export default function Page() {
  const url = `${siteUrl}/network/speed-test`;
  const appSchema = { "@context": "https://schema.org", "@type": "SoftwareApplication", name: "SignalRate Internet Speed Test", applicationCategory: "UtilitiesApplication", operatingSystem: "Web", url };
  const crumbs = { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Network", item: `${siteUrl}/network` }, { "@type": "ListItem", position: 2, name: "Internet Speed Test", item: url }] };
  return <><Header/><main className="shell py-10 sm:py-16"><nav aria-label="Breadcrumb" className="text-sm text-slate-500"><Link href="/">Home</Link> / <Link href="/network">Network</Link> / Internet Speed Test</nav><header className="mt-7 max-w-3xl"><p className="text-sm font-bold uppercase tracking-[.18em] text-[#315efb]">Connection testing</p><h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">Internet Speed Test</h1><p className="mt-4 text-lg leading-8 text-slate-600">Measure download speed, upload speed, idle latency, and jitter from this browser to Cloudflare&apos;s edge network. The test runs only after you start it.</p></header><InternetSpeedTest/><div className="mt-12 grid gap-6 lg:grid-cols-[minmax(0,1fr)_19rem]"><article><h2 className="text-2xl font-bold">Understanding the result</h2><p className="mt-3 leading-7 text-slate-600">Download and upload are measured in megabits per second (Mbps). Ping is the round-trip delay while the connection is idle, and jitter is how much consecutive latency samples vary. A single run is a point-in-time estimate rather than a guaranteed line rate.</p><h2 className="mt-8 text-2xl font-bold">Why results change</h2><p className="mt-3 leading-7 text-slate-600">Wi-Fi signal, VPNs, device load, other household traffic, peering, and temporary congestion can all affect a run. Compare several tests at different times and use a wired connection when diagnosing an access line.</p></article><aside className="rounded-2xl border bg-white p-5"><h2 className="font-bold">Related tools</h2><div className="mt-3 flex flex-col gap-2 text-sm font-semibold text-[#315efb]"><Link href="/network/bandwidth-calculator">Bandwidth Calculator</Link><Link href="/network/download-time-calculator">Download Time Calculator</Link><Link href="/network/what-is-my-ip">What Is My IP</Link><Link href="/network">All network tools</Link></div></aside></div><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(appSchema) }}/><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs) }}/></main><Footer/></>;
}
