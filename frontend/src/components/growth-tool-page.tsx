import Link from "next/link";
import { Footer, Header } from "@/components/site-chrome";
import { GrowthToolClient } from "@/components/growth-tool-client";
import { FlagshipSeoContent } from "@/components/flagship-seo-content";
import { flagshipSeoByPath } from "@/lib/flagship-seo";
import { common, localizedPath, shellCopy, type LocaleUrl } from "@/lib/i18n";
import { jsonLd } from "@/lib/json-ld";
import {
  growthTools,
  localizedTool,
  type GrowthTool,
} from "@/lib/growth-tools";

export function GrowthToolPage({
  tool,
  locale,
}: {
  tool: GrowthTool;
  locale?: LocaleUrl;
}) {
  const localized = localizedTool(tool, locale),
    seo = locale ? undefined : flagshipSeoByPath[tool.path],
    t = seo ? { ...localized, title: seo.heading, description: seo.description } : localized,
    c = common[locale ?? "en"],
    prefix = locale ? `/${locale}` : "";
  const parent = tool.group === "Calculator"
    ? { path: "/calculators", label: c.calculators }
    : tool.path.startsWith("/developer-tools/")
      ? { path: "/developer-tools", label: shellCopy[locale ?? "en"].developerTools }
      : tool.group === "Utility"
        ? { path: "/tools", label: c.tools }
        : { path: "/network", label: shellCopy[locale ?? "en"].networkTools };
  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: t.title,
    url: `https://signal-rate.com${localizedPath(tool.path, locale)}`,
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Web",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  };
  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: c.home, item: `https://signal-rate.com${locale ? `/${locale}` : ""}` },
      { "@type": "ListItem", position: 2, name: parent.label, item: `https://signal-rate.com${localizedPath(parent.path, locale)}` },
      { "@type": "ListItem", position: 3, name: t.title, item: `https://signal-rate.com${localizedPath(tool.path, locale)}` },
    ],
  };
  if (tool.kind === "hub")
    return (
      <div dir={locale === "ar" ? "rtl" : "ltr"}>
        <Header />
        <main className="shell py-12">
          <h1 className="text-4xl font-bold">{t.title}</h1>
          <p className="mt-4 max-w-3xl text-lg text-slate-600">
            {t.description}
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {growthTools
              .filter((x) => x.group === "Calculator" && x.kind !== "hub")
              .map((x) => {
                const tx = localizedTool(x, locale);
                return (
                  <Link
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-blue-400"
                    key={x.path}
                    href={localizedPath(x.path, locale)}
                  >
                    <h2 className="font-bold">{tx.title}</h2>
                    <p className="mt-2 text-sm text-slate-600">
                      {tx.description}
                    </p>
                  </Link>
                );
              })}
          </div>
        </main>
        <Footer />
      </div>
    );
  return (
    <div dir={locale === "ar" ? "rtl" : "ltr"}>
      <Header />
      <main className="shell py-10 sm:py-16">
        <nav aria-label="Breadcrumb" className="mb-7 text-sm text-slate-500">
          <Link href={locale ? `/${locale}` : "/"}>{c.home}</Link> /{" "}
          <Link
            href={`${prefix}${parent.path}`}
          >
            {parent.label}
          </Link>{" "}
          / {t.title}
        </nav>
        <div className="mx-auto max-w-5xl">
          <p className="text-sm font-bold uppercase tracking-[.18em] text-[#315efb]">
            {tool.group}
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
            {t.title}
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
            {t.description}
          </p>
          <div className="mt-8">
            <GrowthToolClient kind={tool.kind} locale={locale} />
          </div>
          {seo ? <FlagshipSeoContent path={tool.path} /> : <section className="mt-12 grid gap-7 md:grid-cols-2">
            <article>
              <h2 className="text-2xl font-bold">{c.about}</h2>
              <p className="mt-3 leading-7 text-slate-600">
                {t.description} SignalRate presents the formula, source, or
                measurement limits beside the result so it can be interpreted
                accurately.
              </p>
              <h3 className="mt-5 font-bold">{c.limitations}</h3>
              <p className="mt-2 text-slate-600">
                Results depend on the supplied values, browser capabilities, or
                the remote service at the time of checking. They are
                informational and should be independently verified for critical
                decisions.
              </p>
            </article>
            <article>
              <h2 className="text-2xl font-bold">{c.related}</h2>
              <div className="mt-3 flex flex-col gap-2">
                {growthTools
                  .filter((x) => x.group === tool.group && x.path !== tool.path)
                  .slice(0, 5)
                  .map((x) => (
                    <Link
                      className="text-[#315efb]"
                      key={x.path}
                      href={localizedPath(x.path, locale)}
                    >
                      {localizedTool(x, locale).title}
                    </Link>
                  ))}
              </div>
              <p className="mt-5 rounded-xl bg-blue-50 p-4 text-sm text-slate-700">
                {c.privacy}
              </p>
            </article>
          </section>}
        </div>
      </main>
      <Footer />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(schema) }}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbs) }} />
    </div>
  );
}
