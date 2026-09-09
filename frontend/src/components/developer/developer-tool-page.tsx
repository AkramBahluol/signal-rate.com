import type {Metadata} from "next";
import Link from "next/link";
import {DeveloperTool} from "@/components/developer/developer-tool";
import {FlagshipSeoContent} from "@/components/flagship-seo-content";
import {Footer,Header} from "@/components/site-chrome";
import {developerToolBySlug,developerToolPath,type DeveloperToolSlug} from "@/lib/developer-tools";
import {flagshipMetadata,flagshipSeoByPath} from "@/lib/flagship-seo";
import {jsonLd} from "@/lib/json-ld";

export function developerToolMetadata(slug:DeveloperToolSlug):Metadata {
  const tool=developerToolBySlug[slug];
  const path=developerToolPath(slug);
  const flagship=flagshipMetadata(path);
  if(flagship)return flagship;
  return {title:tool.name,description:tool.description,alternates:{canonical:path},openGraph:{title:`${tool.name} | SignalRate`,description:tool.description,url:path,type:"website"}};
}

export function DeveloperToolPage({slug}:{slug:DeveloperToolSlug}) {
  const tool=developerToolBySlug[slug];
  const path=developerToolPath(slug);
  const seo=flagshipSeoByPath[path];
  const title=seo?.heading??tool.name;
  const description=seo?.description??tool.description;
  const schema={"@context":"https://schema.org","@type":"SoftwareApplication",name:title,applicationCategory:"DeveloperApplication",operatingSystem:"Web",url:`https://signal-rate.com${path}`,offers:{"@type":"Offer",price:"0",priceCurrency:"USD"}};
  const breadcrumbs={"@context":"https://schema.org","@type":"BreadcrumbList",itemListElement:[{"@type":"ListItem",position:1,name:"Home",item:"https://signal-rate.com"},{"@type":"ListItem",position:2,name:"Developer Tools",item:"https://signal-rate.com/developer-tools"},{"@type":"ListItem",position:3,name:title,item:`https://signal-rate.com${path}`}]};
  return <><Header/><main className="shell py-10 sm:py-16"><nav aria-label="Breadcrumb" className="text-sm text-slate-500"><Link href="/">Home</Link> / <Link href="/developer-tools">Developer tools</Link> / {title}</nav><div className="mt-7 grid gap-10 lg:grid-cols-[minmax(0,1fr)_19rem]"><div className="min-w-0"><p className="text-sm font-bold uppercase tracking-[.18em] text-[#315efb]">{tool.category}</p><h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">{title}</h1><p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">{description}</p><DeveloperTool mode={slug}/>{seo?<FlagshipSeoContent compact path={path}/>:<article className="mt-12 max-w-3xl"><h2 className="text-2xl font-bold">{tool.explanationTitle}</h2><p className="mt-3 leading-7 text-slate-600">{tool.explanation}</p><ul className="mt-5 list-disc space-y-2 pl-5 text-slate-600">{tool.notes.map(note=><li key={note}>{note}</li>)}</ul></article>}</div><aside className="space-y-6"><div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5"><p className="font-bold text-emerald-900">Processed in your browser</p><p className="mt-2 text-sm leading-6 text-emerald-800">Your input is not uploaded, logged, or stored by SignalRate. Clearing the page removes it from this tool.</p></div><div className="rounded-2xl border bg-white p-5"><h2 className="font-bold">Related tools</h2><div className="mt-3 flex flex-col gap-3 text-sm">{seo?seo.related.map(related=><div key={related.path}><Link className="font-semibold text-[#315efb]" href={related.path}>{related.label}</Link><p className="mt-1 text-slate-600">{related.context}</p></div>):tool.related.map(related=><Link className="font-semibold text-[#315efb]" key={related} href={developerToolPath(related)}>{developerToolBySlug[related].name}</Link>)}</div></div><div className="rounded-2xl border bg-white p-5"><h2 className="font-bold">Network utilities</h2><div className="mt-3 flex flex-col gap-2 text-sm font-semibold text-[#315efb]"><Link href="/network/dns-lookup">DNS Lookup</Link><Link href="/network/ip-lookup">IP Lookup</Link><Link href="/network">All network tools</Link></div></div></aside></div><script type="application/ld+json" dangerouslySetInnerHTML={{__html:jsonLd(schema)}}/><script type="application/ld+json" dangerouslySetInnerHTML={{__html:jsonLd(breadcrumbs)}}/></main><Footer/></>;
}
