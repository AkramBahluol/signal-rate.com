import type { MetadataRoute } from "next";
import { apiGet } from "@/lib/api";
import type { Country,ErrorFamily,ErrorListResponse,MobilePlanResponse,Network,Operator,PaginatedResponse } from "@/lib/types";
import {developerToolPath,developerTools} from "@/lib/developer-tools";
import {isIndexableTelecom} from "@/lib/telecom-utils";
import {networkTools} from "@/lib/network-tools";
import {siteUrl} from "@/lib/site";
import {growthTools} from "@/lib/growth-tools";
import {alternates,locales} from "@/lib/i18n";
import {flagshipPaths} from "@/lib/flagship-seo";
import {fullyLocalizedFlagshipPaths}from"@/lib/localized-routes";
import{guides}from"@/lib/authority-content";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const paths = [
    "", "/network", "/network/what-is-my-ip", "/network/ip-lookup", "/network/asn-lookup", "/network/ip-whois",
    "/network/reverse-dns", "/network/hostname-lookup", "/network/dns-lookup", "/network/port-checker",
    "/network/ip-blacklist-check", "/network/subnet-calculator", "/network/cidr-calculator", "/network/ip-calculator",
    "/tools", "/tools/sms-character-counter",
    "/tools/gsm7-checker", "/tools/sms-segment-calculator", "/tools/unicode-sms-checker",
    "/tools/e164-phone-formatter", "/tools/mcc-mnc-lookup", "/countries", "/calling-codes", "/mcc", "/carriers", "/errors", "/about", "/contact", "/privacy", "/terms", "/methodology", "/data-policy", "/guides", ...guides.map(g=>`/guides/${g.slug}`), "/data", "/data/telecom", "/data/calling-codes", "/data/mcc-mnc", "/data-sources", "/api",
  ];
  paths.push("/developer-tools",...developerTools.map(tool=>developerToolPath(tool.slug)),"/network/email-security",...networkTools.map(tool=>tool.path));
  paths.push(...growthTools.map(tool=>tool.path));
  const base = [...new Set(paths)].map(path => ({ url: `${siteUrl}${path}`, changeFrequency: "weekly" as const, priority: path === "" ? 1 : 0.8, ...((growthTools.some(t=>t.path===path)&&!flagshipPaths.has(path))||fullyLocalizedFlagshipPaths.has(path)?{alternates:{languages:alternates(path)}}:{}) }));
  const localizedPaths=new Set([...growthTools.filter(tool=>!flagshipPaths.has(tool.path)).map(tool=>tool.path),...fullyLocalizedFlagshipPaths]);
  const localized=Array.from(localizedPaths).flatMap(path=>locales.map(locale=>({url:`${siteUrl}/${locale.url}${path}`,changeFrequency:"weekly" as const,priority:.7,alternates:{languages:alternates(path)}})));
  const dynamicEntries:MetadataRoute.Sitemap=[];
  try {
    const {data}=await apiGet<MobilePlanResponse>("/mobile-plans/country/GB?per_page=50");
    const verified = data.filter(plan => plan.verification_status === "verified");
    const operators = [...new Map(verified.map(plan => [plan.operator.slug, plan.operator])).values()].map(operator => ({ url: `${siteUrl}/mobile-plans/uk/${operator.slug}`, changeFrequency: "weekly" as const, priority: 0.7 }));
    const plans = verified.map(plan => ({ url: `${siteUrl}/mobile-plans/uk/${plan.operator.slug}/${plan.slug}`, ...(plan.last_verified_at?{lastModified:new Date(plan.last_verified_at)}:{}), changeFrequency: "weekly" as const, priority: 0.7 }));
    dynamicEntries.push(...operators,...plans);
  }catch{/* An unavailable plan service must not remove other sitemap verticals. */}
  try{
    const [{data:families},{data:errors}]=await Promise.all([apiGet<{data:ErrorFamily[]}>("/error-families"),apiGet<ErrorListResponse>("/errors?per_page=100")]);
    const errorFamilies=families.map(family=>({url:`${siteUrl}/errors/${family.slug}`,changeFrequency:"monthly" as const,priority:0.7}));
    const errorPages=errors.map(error=>({url:`${siteUrl}${error.url}`,lastModified:new Date(error.last_verified_at),changeFrequency:"monthly" as const,priority:0.7}));
    dynamicEntries.push(...errorFamilies,...errorPages);
  }catch{/* The static sitemap remains valid during a temporary API outage. */}
  try{
    const first=await apiGet<PaginatedResponse<Country>>("/countries?per_page=100");
    const pages=[first];for(let page=2;page<=first.meta.last_page;page++)pages.push(await apiGet<PaginatedResponse<Country>>(`/countries?per_page=100&page=${page}`));
    const countries=pages.flatMap(page=>page.data).filter(country=>isIndexableTelecom(country,country.calling_codes.some(code=>code.verification_status==="verified")));
    dynamicEntries.push(...countries.map(country=>({url:`${siteUrl}/countries/${country.slug}`,...(country.last_verified_at?{lastModified:new Date(country.last_verified_at)}:{}),changeFrequency:"monthly" as const,priority:0.7})));
    const networks=await apiGet<PaginatedResponse<Network>>("/mcc?per_page=100");
    const verified=networks.data.filter(network=>isIndexableTelecom(network,Boolean(network.assignment_name&&network.country)));
    const mccs=[...new Set(verified.map(network=>network.mcc))];
    dynamicEntries.push(...mccs.map(mcc=>({url:`${siteUrl}/mcc/${mcc}`,changeFrequency:"monthly" as const,priority:0.7})),...verified.map(network=>({url:`${siteUrl}/mcc/${network.mcc}/${network.mnc}`,...(network.last_verified_at?{lastModified:new Date(network.last_verified_at)}:{}),changeFrequency:"monthly" as const,priority:0.65})));
    const carriers=await apiGet<PaginatedResponse<Operator>>("/carriers?per_page=100");
    const verifiedCarriers=carriers.data.filter(operator=>isIndexableTelecom(operator,Boolean(operator.network_assignments?.length)));
    dynamicEntries.push(...[...new Map(verifiedCarriers.map(operator=>[operator.country.slug,operator.country])).values()].map(country=>({url:`${siteUrl}/carriers/${country.slug}`,changeFrequency:"monthly" as const,priority:0.65})),...verifiedCarriers.map(operator=>({url:`${siteUrl}/carriers/${operator.country.slug}/${operator.slug}`,...(operator.last_verified_at?{lastModified:new Date(operator.last_verified_at)}:{}),changeFrequency:"monthly" as const,priority:0.65})));
  }catch{/* Quality-gated telecom pages are omitted if the directory API is unavailable. */}
  return[...new Map([...base,...localized,...dynamicEntries].map(entry=>[entry.url,entry])).values()];
}
