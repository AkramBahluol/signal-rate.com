"use client";
import {usePathname} from "next/navigation";
import {locales,resolveLocalePath,type SiteLocale} from "@/lib/locale-routing";

export function LanguageSwitcher({current,label}:{current:SiteLocale;label:string}){
 const pathname=usePathname();
 return <label className="sr-language"><span className="sr-only">{label}</span><select aria-label={label} value={current} onChange={e=>window.location.assign(resolveLocalePath(pathname,e.target.value as SiteLocale,window.location.search))} className="max-w-36 rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm">
  <option value="en">English</option>{locales.map(l=><option key={l.url} value={l.url}>{l.name}</option>)}
 </select></label>
}
