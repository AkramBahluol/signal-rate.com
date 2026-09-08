import type {TelecomVerificationStatus} from "@/lib/types";

export const verificationPresentation:Record<TelecomVerificationStatus,{label:string;description:string;tone:string}>={
  verified:{label:"Verified",description:"Checked against the cited authoritative source.",tone:"emerald"},
  stale:{label:"Stale",description:"The last verification is outside the expected review window.",tone:"amber"},
  unverified:{label:"Unverified",description:"Do not treat this record as confirmed current information.",tone:"amber"},
  conflicted:{label:"Conflicted",description:"Authoritative sources disagree; the value is pending review.",tone:"rose"},
  deprecated:{label:"Deprecated",description:"The source marks this identifier as retired or superseded.",tone:"slate"},
};
export function verificationFor(status:string){return verificationPresentation[status as TelecomVerificationStatus]??verificationPresentation.unverified}
export function normalizeTelecomQuery(input:string){return input.trim().replace(/\b(?:mcc|mnc)\b/gi," ").replace(/[\s/-]+/g," ").trim()}
export function safePage(input:string|string[]|undefined){const value=Array.isArray(input)?input[0]:input;const page=Number(value);return Number.isInteger(page)&&page>0?page:1}
export function isIndexableTelecom(record:{verification_status:string;active?:boolean},hasUsefulContent=true){return record.verification_status==="verified"&&record.active!==false&&hasUsefulContent}
