export const MAX_TEXT_INPUT = 1_000_000;
export const MAX_DIFF_INPUT = 200_000;
export const MAX_DIFF_LINES = 600;

export type JsonValidation = {valid:true;value:unknown}|{valid:false;message:string;line?:number;column?:number};

function enforceLimit(value:string, limit=MAX_TEXT_INPUT) {
  if (value.length > limit) throw new Error(`Input is too large. The limit is ${limit.toLocaleString()} characters.`);
}

export function validateJson(input:string):JsonValidation {
  enforceLimit(input);
  if (!input.trim()) return {valid:false,message:"Enter JSON to validate.",line:1,column:1};
  try { return {valid:true,value:JSON.parse(input)}; }
  catch (error) {
    const message=error instanceof Error?error.message:"Invalid JSON.";
    const match=message.match(/(?:position|column)\s+(\d+)/i);
    if (!match) return {valid:false,message};
    const position=Math.min(Number(match[1]),input.length);
    const before=input.slice(0,position);
    const lines=before.split("\n");
    return {valid:false,message,line:lines.length,column:(lines.at(-1)?.length??0)+1};
  }
}

export function transformJson(input:string, compact=false):string {
  const validation=validateJson(input);
  if (!validation.valid) throw new Error(formatJsonError(validation));
  let output="",indent=0,inString=false,escaped=false;
  const nextNonSpace=(index:number)=>{for(let i=index+1;i<input.length;i++)if(!/\s/.test(input[i]))return input[i];return "";};
  for(let index=0;index<input.length;index++){
    const char=input[index];
    if(inString){output+=char;if(escaped)escaped=false;else if(char==="\\")escaped=true;else if(char==='"')inString=false;continue;}
    if(char==='"'){inString=true;output+=char;continue;}
    if(/\s/.test(char))continue;
    if(compact){output+=char;continue;}
    if(char==="{"||char==="["){output+=char;if(nextNonSpace(index)!==(char==="{"?"}":"]")){indent++;output+="\n"+"  ".repeat(indent);}continue;}
    if(char==="}"||char==="]"){if(output.at(-1)!==(char==="}"?"{":"[")){indent--;output+="\n"+"  ".repeat(indent);}output+=char;continue;}
    if(char===","){output+=",\n"+"  ".repeat(indent);continue;}
    if(char===":"){output+=": ";continue;}
    output+=char;
  }
  return output;
}

export function formatJsonError(error:Extract<JsonValidation,{valid:false}>){return `${error.message}${error.line?` (line ${error.line}, column ${error.column})`:""}`;}

function bytesToBase64(bytes:Uint8Array){let binary="";for(let i=0;i<bytes.length;i+=0x8000)binary+=String.fromCharCode(...bytes.subarray(i,i+0x8000));return btoa(binary);}
export function encodeBase64(input:string,urlSafe=false){enforceLimit(input);const encoded=bytesToBase64(new TextEncoder().encode(input));return urlSafe?encoded.replaceAll("+","-").replaceAll("/","_").replace(/=+$/g,""):encoded;}
export function decodeBase64(input:string,urlSafe=false){enforceLimit(input);let normalized=input.trim().replace(/\s/g,"");if(urlSafe)normalized=normalized.replaceAll("-","+").replaceAll("_","/");if(!/^[A-Za-z0-9+/]*={0,2}$/.test(normalized)||normalized.length%4===1)throw new Error("Enter valid Base64 data.");normalized=normalized.padEnd(Math.ceil(normalized.length/4)*4,"=");try{const binary=atob(normalized);const bytes=Uint8Array.from(binary,char=>char.charCodeAt(0));return new TextDecoder("utf-8",{fatal:true}).decode(bytes);}catch{throw new Error("The value is not valid Base64-encoded UTF-8 text.");}}

export type JwtResult={header:Record<string,unknown>;payload:Record<string,unknown>;signature:string;claims:Record<string,string>};
export function decodeJwt(token:string):JwtResult {enforceLimit(token,100_000);const parts=token.trim().split(".");if(parts.length!==3||parts.some(part=>!part))throw new Error("A JWT must contain three non-empty dot-separated segments.");try{const header=JSON.parse(decodeBase64(parts[0],true));const payload=JSON.parse(decodeBase64(parts[1],true));if(!header||typeof header!=="object"||Array.isArray(header)||!payload||typeof payload!=="object"||Array.isArray(payload))throw new Error();const claims:Record<string,string>={};for(const key of ["iss","sub","aud"]){const value=payload[key];if(value!==undefined)claims[key]=Array.isArray(value)?value.join(", "):String(value);}for(const key of ["iat","exp","nbf"]){const value=payload[key];if(typeof value==="number"&&Number.isFinite(value))claims[key]=new Date(value*1000).toISOString();}return {header,payload,signature:parts[2],claims};}catch(error){if(error instanceof Error&&error.message.startsWith("A JWT"))throw error;throw new Error("JWT header and payload must be valid Base64URL JSON objects.");}}

export function generateUuidV4(){if(!globalThis.crypto?.randomUUID)throw new Error("Secure UUID generation is unavailable in this browser.");return globalThis.crypto.randomUUID();}
export function validateUuid(input:string){const normalized=input.trim().replace(/^urn:uuid:/i,"").replace(/^\{(.+)\}$/,"$1");const match=normalized.match(/^([0-9a-f]{8})-([0-9a-f]{4})-([1-8][0-9a-f]{3})-([89ab][0-9a-f]{3})-([0-9a-f]{12})$/i);if(!match)return {valid:false as const,normalized,message:"Enter a canonical, braced, or urn:uuid UUID with a recognized RFC variant."};const version=Number(match[3][0]);return {valid:true as const,normalized:normalized.toLowerCase(),version,variant:"RFC 4122 / RFC 9562"};}

export function timestampToDates(input:string,unit:"seconds"|"milliseconds"){if(!/^-?\d+(?:\.\d+)?$/.test(input.trim()))throw new Error("Enter a numeric Unix timestamp.");const raw=Number(input);const milliseconds=unit==="seconds"?raw*1000:raw;if(!Number.isFinite(milliseconds)||Math.abs(milliseconds)>8.64e15)throw new Error("Timestamp is outside the supported JavaScript date range.");const date=new Date(milliseconds);if(Number.isNaN(date.getTime()))throw new Error("Timestamp is invalid.");return {seconds:milliseconds/1000,milliseconds,utc:date.toUTCString(),local:date.toString(),iso:date.toISOString()};}
export function dateToTimestamp(input:string){if(!input)throw new Error("Choose a date and time.");const date=new Date(input);if(Number.isNaN(date.getTime()))throw new Error("Date and time are invalid.");return {seconds:Math.floor(date.getTime()/1000),milliseconds:date.getTime(),iso:date.toISOString()};}

export function transformUrl(input:string,action:"encode"|"decode",scope:"component"|"full"){enforceLimit(input);try{return action==="encode"?(scope==="component"?encodeURIComponent(input):encodeURI(input)):(scope==="component"?decodeURIComponent(input):decodeURI(input));}catch{throw new Error("The value contains a malformed percent-escape sequence.");}}

export async function generateHash(input:string,algorithm:"SHA-256"|"SHA-384"|"SHA-512"){enforceLimit(input);if(!globalThis.crypto?.subtle)throw new Error("Web Crypto is unavailable in this browser context.");const digest=await globalThis.crypto.subtle.digest(algorithm,new TextEncoder().encode(input));return Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,"0")).join("");}

const entityMap:Record<string,string>={amp:"&",lt:"<",gt:">",quot:'"',apos:"'",nbsp:"\u00a0"};
export function encodeHtml(input:string){enforceLimit(input);return input.replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]!));}
export function decodeHtml(input:string){enforceLimit(input);return input.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi,(entity,code:string)=>{if(code[0]!=="#")return entityMap[code.toLowerCase()]??entity;const numeric=code[1].toLowerCase()==="x"?parseInt(code.slice(2),16):parseInt(code.slice(1),10);try{return numeric>=0&&numeric<=0x10ffff?String.fromCodePoint(numeric):entity;}catch{return entity;}});}

export type DiffLine={type:"same"|"added"|"removed";text:string};
export function diffLines(original:string,modified:string):DiffLine[]{enforceLimit(original,MAX_DIFF_INPUT);enforceLimit(modified,MAX_DIFF_INPUT);const left=original.split("\n"),right=modified.split("\n");if(left.length>MAX_DIFF_LINES||right.length>MAX_DIFF_LINES)throw new Error(`Line diff supports up to ${MAX_DIFF_LINES} lines per input.`);const table=Array.from({length:left.length+1},()=>new Uint16Array(right.length+1));for(let i=left.length-1;i>=0;i--)for(let j=right.length-1;j>=0;j--)table[i][j]=left[i]===right[j]?table[i+1][j+1]+1:Math.max(table[i+1][j],table[i][j+1]);const result:DiffLine[]=[];let i=0,j=0;while(i<left.length&&j<right.length){if(left[i]===right[j]){result.push({type:"same",text:left[i]});i++;j++;}else if(table[i+1][j]>=table[i][j+1]){result.push({type:"removed",text:left[i++]});}else result.push({type:"added",text:right[j++]});}while(i<left.length)result.push({type:"removed",text:left[i++]});while(j<right.length)result.push({type:"added",text:right[j++]});return result;}

export function generateSlug(input:string,{lowercase=true,separator="-"}:{lowercase?:boolean;separator?:"-"|"_"}={}){enforceLimit(input);let value=input.normalize("NFKC");if(lowercase)value=value.toLocaleLowerCase();const escaped=separator==="-"?"\\-":"_";return value.replace(/[^\p{L}\p{N}]+/gu,separator).replace(new RegExp(`[${escaped}]+`,`g`),separator).replace(new RegExp(`^[${escaped}]+|[${escaped}]+$`,`g`),"");}
