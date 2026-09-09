"use client";
import {usePathname,useRouter} from "next/navigation";
import {localeCopy,localeFromPathname,locales,resolveLocalePath} from "@/lib/i18n";

export function LanguageSwitcher(){
 const pathname=usePathname(),router=useRouter();
 const current=localeFromPathname(pathname),copy=localeCopy(current);
 return <label className="sr-language"><span className="sr-only">{copy.language}</span><select aria-label={copy.language} value={current} onChange={e=>router.push(resolveLocalePath(pathname,e.target.value as typeof current,window.location.search))} className="max-w-36 rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm">
  <option value="en">English</option>{locales.map(l=><option key={l.url} value={l.url}>{l.name}</option>)}
 </select></label>
}
