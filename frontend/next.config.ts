import type { NextConfig } from "next";

const apiOrigin = (() => {
  try { return new URL(process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").origin; }
  catch { return ""; }
})();
const connectSources = ["'self'", "https://speed.cloudflare.com", ...(process.env.NODE_ENV === "development" && apiOrigin ? [apiOrigin] : [])].join(" ");
const adsenseClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT?.trim() ?? "";
const adsenseEnabled = process.env.NEXT_PUBLIC_ADSENSE_ENABLED === "true" && /^ca-pub-\d{16}$/.test(adsenseClient);
const adsenseScriptSources = adsenseEnabled ? ["https://pagead2.googlesyndication.com", "https://fundingchoicesmessages.google.com", "https://*.adtrafficquality.google"] : [];
const adsenseConnectSources = adsenseEnabled ? ["https://pagead2.googlesyndication.com", "https://fundingchoicesmessages.google.com", "https://googleads.g.doubleclick.net", "https://*.adtrafficquality.google"] : [];
const adsenseFrameSources = adsenseEnabled ? ["https://fundingchoicesmessages.google.com", "https://googleads.g.doubleclick.net", "https://tpc.googlesyndication.com", "https://*.adtrafficquality.google", "https://www.google.com"] : [];
const adsenseImageSources = adsenseEnabled ? ["https://pagead2.googlesyndication.com", "https://googleads.g.doubleclick.net", "https://tpc.googlesyndication.com", "https://*.adtrafficquality.google"] : [];
const scriptSources = ["'self'", "'unsafe-inline'", ...(process.env.NODE_ENV === "development" ? ["'unsafe-eval'"] : []), ...adsenseScriptSources].join(" ");
const allowedConnections = [connectSources, ...adsenseConnectSources].join(" ");
const frameSources = ["'self'", ...adsenseFrameSources].join(" ");
const imageSources = ["'self'", "data:", ...adsenseImageSources].join(" ");

const nextConfig: NextConfig = {
  reactCompiler: true,
  output: "standalone",
  poweredByHeader: false,
  async headers(){return[{source:"/:path*",headers:[{key:"X-Content-Type-Options",value:"nosniff"},{key:"Referrer-Policy",value:"strict-origin-when-cross-origin"},{key:"Permissions-Policy",value:"camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()"},{key:"X-Frame-Options",value:"DENY"},{key:"Content-Security-Policy",value:`default-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'; img-src ${imageSources}; font-src 'self'; style-src 'self' 'unsafe-inline'; script-src ${scriptSources}; connect-src ${allowedConnections}; frame-src ${frameSources}`}]}]}
};

export default nextConfig;
