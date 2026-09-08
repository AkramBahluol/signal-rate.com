export function zonedWallTimeToUtc(value:string,timeZone:string){
 const match=value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);if(!match)throw new Error("Invalid date");
 const [,y,m,d,h,min]=match.map(Number);const wall=Date.UTC(y,m-1,d,h,min);let guess=wall;
 for(let i=0;i<2;i++){const parts=new Intl.DateTimeFormat("en-CA",{timeZone,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(new Date(guess));const get=(type:string)=>Number(parts.find(p=>p.type===type)?.value);const represented=Date.UTC(get("year"),get("month")-1,get("day"),get("hour"),get("minute"));guess+=wall-represented}
 return new Date(guess)
}
