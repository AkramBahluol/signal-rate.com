import type { ErrorSource, ErrorSummary } from "@/lib/types";

export function displayErrorCode(error: Pick<ErrorSummary,"family"|"normalized_code">):string {
  return error.family.key==="smpp"?`0x${error.normalized_code}`:error.normalized_code;
}
export function filterErrors(errors:ErrorSummary[],query:string):ErrorSummary[]{
  const tokens=query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  if(!tokens.length)return errors;
  return errors.filter(error=>tokens.every(token=>`${error.family.name} ${error.code} ${error.normalized_code} ${error.title} ${error.short_description}`.toLowerCase().includes(token)));
}
export function verifiedSources(sources:ErrorSource[]):ErrorSource[]{return sources.filter(source=>source.verification_status==="verified"&&/^https:\/\//.test(source.url));}
export function emptyErrorMessage(query:string):string{return query.trim()?`No published errors match “${query.trim()}”. Try a code, symbolic name, or shorter phrase.`:"No verified errors are published in this family yet.";}
