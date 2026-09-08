import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import {adsEnabled,adsenseClient,siteUrl} from "@/lib/site";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "SignalRate | Compare. Connect. Build.", template: "%s | SignalRate" },
  description: "Practical telecom, developer, and network tools built for accurate answers.",
  alternates: { canonical: "/" },
  openGraph: { type: "website", siteName: "SignalRate", title: "SignalRate", description: "Compare. Connect. Build." },
  twitter: { card: "summary_large_image" },
  other: { "google-adsense-account": "ca-pub-9743834422526607" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const websiteSchema = { "@context": "https://schema.org", "@type": "WebSite", name: "SignalRate", url: siteUrl, potentialAction: { "@type": "SearchAction", target: `${siteUrl}/search?q={search_term_string}`, "query-input": "required name=search_term_string" } };
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      {adsEnabled&&<Script async crossOrigin="anonymous" id="google-adsense-loader" src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClient}`} strategy="beforeInteractive"/>}
      <body className="min-h-full flex flex-col"><a href="#site-content" className="skip-link">Skip to main content</a><div id="site-content" className="contents">{children}</div><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} /></body>
    </html>
  );
}
