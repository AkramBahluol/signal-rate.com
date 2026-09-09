import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";
import {adsEnabled,adsenseClient,siteUrl} from "@/lib/site";
import {isLocale,localeByUrl,localeCopy} from "@/lib/i18n";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "SignalRate | Compare. Connect. Build.", template: "%s | SignalRate" },
  description: "Practical telecom, developer, and network tools built for accurate answers.",
  alternates: { canonical: "/" },
  openGraph: { type: "website", siteName: "SignalRate", title: "SignalRate", description: "Compare. Connect. Build." },
  twitter: { card: "summary_large_image" },
  other: { "google-adsense-account": "ca-pub-9743834422526607" },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const localeHeader=(await headers()).get("x-signalrate-locale")??"en";
  const locale=isLocale(localeHeader)?localeHeader:"en";
  const language=locale==="en"?"en":localeByUrl[locale].tag;
  const direction=locale==="en"?"ltr":localeByUrl[locale].dir;
  const copy=localeCopy(locale);
  const websiteSchema = { "@context": "https://schema.org", "@type": "WebSite", name: "SignalRate", url: siteUrl, potentialAction: { "@type": "SearchAction", target: `${siteUrl}/search?q={search_term_string}`, "query-input": "required name=search_term_string" } };
  return (
    <html
      lang={language}
      dir={direction}
      className="h-full antialiased"
    >
      <head>{adsEnabled&&<script async crossOrigin="anonymous" id="google-adsense-loader" src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClient}`}/>}</head>
      <body className="min-h-full flex flex-col"><a href="#site-content" className="skip-link">{copy.skip}</a><div id="site-content" className="contents">{children}</div><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} /></body>
    </html>
  );
}
