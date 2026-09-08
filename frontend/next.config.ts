import type { NextConfig } from "next";

const apiOrigin = (() => {
  try { return new URL(process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").origin; }
  catch { return ""; }
})();
const connectSources = ["'self'", ...(process.env.NODE_ENV === "development" && apiOrigin ? [apiOrigin] : [])].join(" ");
const scriptSources = ["'self'", "'unsafe-inline'", ...(process.env.NODE_ENV === "development" ? ["'unsafe-eval'"] : [])].join(" ");

const nextConfig: NextConfig = {
  reactCompiler: true,
  output: "standalone",
  poweredByHeader: false,
  async headers(){return[{source:"/:path*",headers:[{key:"X-Content-Type-Options",value:"nosniff"},{key:"Referrer-Policy",value:"strict-origin-when-cross-origin"},{key:"Permissions-Policy",value:"camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()"},{key:"X-Frame-Options",value:"DENY"},{key:"Content-Security-Policy",value:`default-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'; img-src 'self' data:; font-src 'self'; style-src 'self' 'unsafe-inline'; script-src ${scriptSources}; connect-src ${connectSources}`}]}]}
};

export default nextConfig;
