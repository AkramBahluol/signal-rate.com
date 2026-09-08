export const siteUrl=(process.env.NEXT_PUBLIC_SITE_URL??"https://signal-rate.com").replace(/\/$/,"");
export const contactEmail=process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim()||"";
export const adsenseClient=process.env.NEXT_PUBLIC_ADSENSE_CLIENT?.trim()||"";
export const adsEnabled=process.env.NEXT_PUBLIC_ADSENSE_ENABLED==="true"&&/^ca-pub-\d{16}$/.test(adsenseClient);
export const analyticsEnabled=process.env.NEXT_PUBLIC_ANALYTICS_ENABLED==="true";
