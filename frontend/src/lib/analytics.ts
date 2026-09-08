import{analyticsEnabled}from"@/lib/site";
export type SafeAnalyticsEvent="page_view"|"tool_opened"|"tool_used"|"copy_clicked"|"comparison_used";
export function track(event:SafeAnalyticsEvent){if(!analyticsEnabled||typeof window==="undefined")return;window.dispatchEvent(new CustomEvent("signalrate:analytics",{detail:{event}}))}
