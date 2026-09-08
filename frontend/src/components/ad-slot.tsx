import{adsEnabled}from"@/lib/site";
export function AdSlot({slot,className=""}:{slot?:string;className?:string}){if(!adsEnabled||!slot)return null;return <aside aria-label="Advertisement" className={className} data-ad-slot={slot}/>}
