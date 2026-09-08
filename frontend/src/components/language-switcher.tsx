"use client";
import {usePathname,useRouter} from "next/navigation";
import {locales} from "@/lib/i18n";
import {localizedGrowthPaths} from "@/lib/growth-tools";

export function LanguageSwitcher(){
 const pathname=usePathname(),router=useRouter();
 const parts=pathname.split("/").filter(Boolean); const current=locales.find(l=>l.url===parts[0]);
 const base=current?`/${parts.slice(1).join("/")}`:pathname; const preservable=localizedGrowthPaths.has(base);
 return <label className="sr-language"><span className="sr-only">Language</span><select aria-label="Language" value={current?.url??"en"} onChange={e=>{const v=e.target.value;router.push(v==="en"?(preservable?base:"/"):(preservable?`/${v}${base}`:`/${v}`))}} className="max-w-36 rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm">
  <option value="en">English</option>{locales.map(l=><option key={l.url} value={l.url}>{l.name}</option>)}
 </select></label>
}
