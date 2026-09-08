import { Resolver, resolveTxt } from "node:dns/promises";

const origin = (process.env.SIGNALRATE_PUBLIC_ORIGIN || "https://signal-rate.com").replace(/\/$/, "");
const expectedHost = "signal-rate.com";
const failures = [];
const samples = [
  "/",
  "/tools/sms-character-counter",
  "/network/dns-lookup",
  "/developer-tools/json-formatter",
  "/errors/http/404",
  "/countries/germany",
  "/mcc/262",
  "/about",
  "/privacy",
];

async function fetchText(path) {
  const response = await fetch(`${origin}${path}`, { signal: AbortSignal.timeout(20_000) });
  return { response, text: await response.text() };
}

const { response: robotsResponse, text: robots } = await fetchText("/robots.txt");
if (robotsResponse.status !== 200) failures.push(`robots-status-${robotsResponse.status}`);
if (!robots.includes(`Sitemap: ${origin}/sitemap.xml`)) failures.push("robots-sitemap-missing");
const robotsGroups = robots.split(/(?=^User-agent:)/gim);
const wildcardBlocks = robotsGroups.filter(block => /^User-agent:\s*\*\s*$/im.test(block));
if (wildcardBlocks.some(block => /^Disallow:\s*\/\s*$/im.test(block))) failures.push("robots-blocks-all");
if (/localhost|127\.0\.0\.1/i.test(robots)) failures.push("robots-local-origin");

const { response: sitemapResponse, text: sitemap } = await fetchText("/sitemap.xml");
if (sitemapResponse.status !== 200) failures.push(`sitemap-status-${sitemapResponse.status}`);
const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => match[1]);
if (!urls.length) failures.push("sitemap-empty");
if (new Set(urls).size !== urls.length) failures.push("sitemap-duplicates");
for (const value of urls) {
  let url;
  try { url = new URL(value); } catch { failures.push("sitemap-invalid-url"); continue; }
  if (url.protocol !== "https:" || url.hostname !== expectedHost) failures.push(`sitemap-wrong-origin-${value}`);
}

const sampleResults = [];
for (const path of samples) {
  const { response, text } = await fetchText(path);
  const canonical = text.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)/i)?.[1]
    || text.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical/i)?.[1]
    || "";
  const robotsMeta = text.match(/<meta[^>]+name=["']robots["'][^>]+content=["']([^"']+)/i)?.[1] || "";
  if (response.status !== 200) failures.push(`${path}-status-${response.status}`);
  const expectedCanonical = path === "/" ? origin : `${origin}${path}`;
  if (canonical !== expectedCanonical) failures.push(`${path}-canonical`);
  if (/noindex/i.test(robotsMeta)) failures.push(`${path}-noindex`);
  if (/localhost|127\.0\.0\.1/i.test(text)) failures.push(`${path}-local-origin`);
  sampleResults.push({ path, status: response.status, canonical, robots: robotsMeta || "indexable-default" });
}

let searchConsoleVerificationPresent = false;
try {
  let txtRecords = (await resolveTxt(expectedHost)).flat();
  if (!txtRecords.some(value => value.startsWith("google-site-verification="))) {
    const publicResolver = new Resolver();
    publicResolver.setServers(["1.1.1.1", "8.8.8.8"]);
    txtRecords = (await publicResolver.resolveTxt(expectedHost)).flat();
  }
  searchConsoleVerificationPresent = txtRecords.some(value => value.startsWith("google-site-verification="));
} catch {
  try {
    const publicResolver = new Resolver();
    publicResolver.setServers(["1.1.1.1", "8.8.8.8"]);
    const txtRecords = (await publicResolver.resolveTxt(expectedHost)).flat();
    searchConsoleVerificationPresent = txtRecords.some(value => value.startsWith("google-site-verification="));
  } catch {
    searchConsoleVerificationPresent = false;
  }
}

const report = {
  checked_at: new Date().toISOString(),
  origin,
  ready: failures.length === 0,
  search_console_verification_present: searchConsoleVerificationPresent,
  sitemap_url_count: urls.length,
  samples: sampleResults,
  failures: [...new Set(failures)],
};

console.log(JSON.stringify(report, null, 2));
if (failures.length) process.exitCode = 1;
