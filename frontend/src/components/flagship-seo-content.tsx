import Link from "next/link";
import { flagshipSeoByPath } from "@/lib/flagship-seo";
import { jsonLd } from "@/lib/json-ld";

export function FlagshipSeoContent({ path, compact = false }: { path: string; compact?: boolean }) {
  const page = flagshipSeoByPath[path];
  if (!page) return null;
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: page.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };
  const content = <>
    <div className="space-y-9">
      {page.sections.map((section) => <section key={section.heading}><h2 className="text-2xl font-bold">{section.heading}</h2>{section.body.map((paragraph) => <p className="mt-3 leading-7 text-slate-600" key={paragraph}>{paragraph}</p>)}</section>)}
      <section><h2 className="text-2xl font-bold">Frequently asked questions</h2><div className="mt-4 divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white px-5">{page.faqs.map((faq) => <details className="group py-4" key={faq.question}><summary className="cursor-pointer list-none font-semibold text-slate-900">{faq.question}<span aria-hidden="true" className="float-right text-blue-600 group-open:rotate-45">+</span></summary><p className="mt-3 pr-6 leading-7 text-slate-600">{faq.answer}</p></details>)}</div></section>
    </div>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(faqSchema) }} />
  </>;
  if (compact) return <article className="mt-12 max-w-3xl">{content}</article>;
  return <div className="mt-12 grid gap-8 lg:grid-cols-[minmax(0,1fr)_19rem]"><article>{content}</article><aside className="h-fit rounded-2xl border bg-white p-5"><h2 className="font-bold">Related tools</h2><div className="mt-4 flex flex-col gap-4">{page.related.map((related) => <div key={related.path}><Link className="font-semibold text-[#315efb]" href={related.path}>{related.label}</Link><p className="mt-1 text-sm leading-5 text-slate-600">{related.context}</p></div>)}</div></aside></div>;
}
