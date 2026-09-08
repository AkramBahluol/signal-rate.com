import type{Metadata}from"next";import{alternates}from"./i18n";import{localizedGrowthPaths}from"./growth-tools";
export function networkMetadata(title:string,description:string,path:string):Metadata{return{title,description,alternates:{canonical:path,...(localizedGrowthPaths.has(path)?{languages:alternates(path)}:{})},openGraph:{title:`${title} | SignalRate`,description,url:path,type:"website"}}}
