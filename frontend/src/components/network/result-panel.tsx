"use client";

import { useState } from "react";

function label(key: string) {
  return key.replaceAll("_", " ").replace(/\b\w/g, character => character.toUpperCase());
}

type Text={result:string;copy:string;copied:string;unavailable:string;yes:string;no:string;none:string};const english:Text={result:"Result",copy:"Copy IP",copied:"Copied",unavailable:"Unavailable",yes:"Yes",no:"No",none:"None returned"};
function Value({ value,text }: { value: unknown;text:Text }) {
  if (value === null || value === undefined || value === "") return <span className="text-slate-500">{text.unavailable}</span>;
  if (typeof value === "boolean") return <span>{value ? text.yes : text.no}</span>;
  if (typeof value === "string" && /^https:\/\//.test(value)) return <a className="break-all font-semibold text-[#315efb]" href={value} rel="nofollow noopener">{value}</a>;
  if (typeof value === "string" || typeof value === "number") return <span className="break-all">{String(value)}</span>;
  if (Array.isArray(value)) return value.length ? <ul className="space-y-1">{value.map((item, index) => <li key={index}>{typeof item === "object" ? <Value value={item} text={text}/> : <span className="break-all">{String(item)}</span>}</li>)}</ul> : <span className="text-slate-500">{text.none}</span>;
  return <dl className="mt-2 grid gap-2 rounded-xl bg-slate-50 p-3">{Object.entries(value as Record<string, unknown>).map(([key, item]) => <div key={key}><dt className="text-xs font-bold uppercase tracking-wide text-slate-500">{label(key)}</dt><dd className="mt-1"><Value value={item} text={text}/></dd></div>)}</dl>;
}

export function ResultPanel({ data, copyValue,labels,keyLabels={} }: { data: Record<string, unknown>; copyValue?: string;labels?:Partial<Text>;keyLabels?:Record<string,string> }) {
  const text={...english,...labels};
  const [copied, setCopied] = useState(false);
  async function copy() {
    if (!copyValue) return;
    await navigator.clipboard.writeText(copyValue);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }
  return <section aria-live="polite" className="mt-6 rounded-2xl border bg-white p-5 shadow-sm"><div className="flex items-center justify-between gap-3"><h2 className="text-xl font-bold">{text.result}</h2>{copyValue && <button type="button" onClick={copy} className="rounded-lg border px-3 py-2 text-sm font-semibold">{copied ? text.copied : text.copy}</button>}</div><dl className="mt-5 grid gap-4 sm:grid-cols-2">{Object.entries(data).map(([key, value]) => <div className="min-w-0 border-t border-slate-100 pt-3" key={key}><dt className="text-xs font-bold uppercase tracking-wide text-slate-500">{keyLabels[key]??label(key)}</dt><dd className="mt-1"><Value value={value} text={text}/></dd></div>)}</dl></section>;
}
