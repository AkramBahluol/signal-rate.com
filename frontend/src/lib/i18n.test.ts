import {describe,expect,it} from "vitest";
import {alternates,isLocale,localeByUrl,localeFromPathname,localizedPath,resolveLocalePath,safeLocaleSearch,stripLocalePrefix} from "./i18n";
import {localizedGrowthPaths} from "./growth-tools";

describe("i18n",()=>{
  it("resolves supported locales and RTL",()=>{
    expect(isLocale("pt-br")).toBe(true);expect(isLocale("en")).toBe(false);expect(localeByUrl.ar.dir).toBe("rtl");
  });
  it("builds self paths and hreflang",()=>{
    expect(localizedPath("/calculators/percentage-calculator","ar")).toBe("/ar/calculators/percentage-calculator");expect(alternates("/network/ping-test")["pt-BR"]).toContain("/pt-br/network/ping-test");expect(alternates("/network/ping-test")["x-default"]).toMatch(/\/network\/ping-test$/);
  });
  it("preserves the current route through every locale transition",()=>{
    let path="/network/what-is-my-ip";path=resolveLocalePath(path,"ar");expect(path).toBe("/ar/network/what-is-my-ip");path=resolveLocalePath(path,"ja");expect(path).toBe("/ja/network/what-is-my-ip");path=resolveLocalePath(path,"de");expect(path).toBe("/de/network/what-is-my-ip");expect(resolveLocalePath(path,"en")).toBe("/network/what-is-my-ip");expect(path).not.toContain("/calculators");
  });
  it("avoids duplicate prefixes and keeps only safe query parameters",()=>{
    expect(stripLocalePrefix("/ar/ja/countries")).toBe("/countries");expect(resolveLocalePath("/ar/ja/countries","de")).toBe("/de/countries");expect(resolveLocalePath("/ar/countries","ja","?page=2&q=libya&jwt=secret")).toBe("/ja/countries?page=2&q=libya");expect(safeLocaleSearch("?url=https://example.com&page=3")).toBe("?page=3");expect(localeFromPathname("/pt-br/tools")).toBe("pt-br");
  });
  it("does not treat fallback directories as translated",()=>expect(localizedGrowthPaths.has("/countries")).toBe(false));
});
