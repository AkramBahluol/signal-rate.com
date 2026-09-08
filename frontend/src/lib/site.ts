export const siteUrl=(process.env.NEXT_PUBLIC_SITE_URL??"https://signal-rate.com").replace(/\/$/,"");
export const contactEmail=process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim()||"";
export const adsEnabled=process.env.NEXT_PUBLIC_ADSENSE_ENABLED==="true"&&Boolean(process.env.NEXT_PUBLIC_ADSENSE_CLIENT);
export const analyticsEnabled=process.env.NEXT_PUBLIC_ANALYTICS_ENABLED==="true";
