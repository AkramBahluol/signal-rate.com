import type{Metadata}from"next";import{notFound}from"next/navigation";import{GrowthToolPage}from"@/components/growth-tool-page";import{flagshipMetadata}from"@/lib/flagship-seo";import{alternates}from"@/lib/i18n";import{growthByPath,growthTools}from"@/lib/growth-tools";
type Props={params:Promise<{slug?:string[]}>};const path=(slug?:string[])=>`/calculators${slug?.length?`/${slug.join("/")}`:""}`;
export function generateStaticParams(){return growthTools.filter(t=>t.path.startsWith("/calculators")).map(t=>({slug:t.path==="/calculators"?[]:t.path.split("/").slice(2)}))}
export async function generateMetadata({params}:Props):Promise<Metadata>{const p=path((await params).slug),t=growthByPath[p];if(!t)return{};return flagshipMetadata(p)??{title:t.title,description:t.description,alternates:{canonical:p,languages:alternates(p)}}}
export default async function Page({params}:Props){const t=growthByPath[path((await params).slug)];if(!t)notFound();return <GrowthToolPage tool={t}/>}
