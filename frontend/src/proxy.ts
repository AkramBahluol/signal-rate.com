import { NextResponse, type NextRequest } from "next/server";
import { isLocale, stripLocalePrefix } from "@/lib/i18n";
import { localizedGrowthPaths } from "@/lib/growth-tools";
import { fullyLocalizedFlagshipPaths } from "@/lib/localized-flagships";

const localizedShellPages = new Set(["/", "/tools", "/network", "/developer-tools", "/calculators", "/errors"]);

export function proxy(request: NextRequest) {
  const segments = request.nextUrl.pathname.split("/").filter(Boolean);
  const locale = segments[0]?.toLowerCase();
  if (!locale || !isLocale(locale)) return NextResponse.next();

  const basePath = stripLocalePrefix(request.nextUrl.pathname);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-signalrate-locale", locale);

  if (localizedGrowthPaths.has(basePath) || fullyLocalizedFlagshipPaths.has(basePath) || localizedShellPages.has(basePath)) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  const target = request.nextUrl.clone();
  target.pathname = basePath;
  const response = NextResponse.rewrite(target, { request: { headers: requestHeaders } });
  response.headers.set("X-Robots-Tag", "noindex, follow");
  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|ads.txt).*)"],
};
