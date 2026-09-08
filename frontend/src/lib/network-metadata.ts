import type{Metadata}from"next";
export function networkMetadata(title:string,description:string,path:string):Metadata{return{title,description,alternates:{canonical:path},openGraph:{title:`${title} | SignalRate`,description,url:path,type:"website"}}}
