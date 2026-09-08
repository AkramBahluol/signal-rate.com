import { writeFile } from "node:fs/promises";

const origin = (process.env.SIGNALRATE_AUDIT_ORIGIN || "http://localhost:3000").replace(/\/$/, "");
const outputDir = new URL("../docs/", import.meta.url);
const extraRoutes = [
  "/search", "/mobile-plans", "/mobile-plans/uk", "/mobile-plans/uk/find",
  "/mobile-plans/uk/compare", "/mcc/999",
];
const fetchWithTimeout = (url, options = {}) => fetch(url, { ...options, signal: AbortSignal.timeout(10_000) });

const decode = value => value
  .replaceAll("&amp;", "&").replaceAll("&quot;", '"').replaceAll("&#x27;", "'")
  .replaceAll("&lt;", "<").replaceAll("&gt;", ">");
const attribute = (html, tag, name) => {
  const tags = html.match(new RegExp(`<${tag}\\b[^>]*>`, "gi")) || [];
  for (const candidate of tags) {
    const match = candidate.match(new RegExp(`${name}=["']([^"']*)["']`, "i"));
    if (match) return decode(match[1]);
  }
  return "";
};
const meta = (html, key) => {
  const tags = html.match(/<meta\b[^>]*>/gi) || [];
  for (const tag of tags) {
    const marker = tag.match(/(?:name|property)=["']([^"']+)["']/i)?.[1]?.toLowerCase();
    if (marker === key) return decode(tag.match(/content=["']([^"']*)["']/i)?.[1] || "");
  }
  return "";
};
const visibleText = html => decode(html
  .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
  .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
  .replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
const classify = path => {
  if (path.startsWith("/errors/")) return ["errors", "error detail", "troubleshooting"];
  if (path === "/errors") return ["errors", "directory", "troubleshooting"];
  if (path.startsWith("/developer-tools/")) return ["developer", "tool", "tool"];
  if (path === "/developer-tools") return ["developer", "directory", "tool discovery"];
  if (path.startsWith("/network/")) return ["network", "tool", "tool"];
  if (path === "/network") return ["network", "directory", "tool discovery"];
  if (path.startsWith("/tools/")) return ["telecom", "tool", "tool"];
  if (["/tools", "/countries", "/calling-codes", "/mcc", "/carriers"].includes(path)) return ["telecom", "directory", "telecom reference"];
  if (/^\/(countries|calling-codes|mcc|carriers)\//.test(path)) return ["telecom", "reference detail", "telecom reference"];
  if (path.startsWith("/mobile-plans")) return ["mobile plans", "comparison foundation", "commercial comparison"];
  if (["/about", "/contact", "/privacy", "/terms", "/methodology", "/data-policy"].includes(path)) return ["trust", "legal/trust", "informational"];
  if (path === "/search") return ["search", "search results", "navigation"];
  return ["core", "landing page", "navigation"];
};

async function get(path) {
  const response = await fetchWithTimeout(`${origin}${path}`, { redirect: "manual" });
  return { response, html: (response.headers.get("content-type") || "").includes("text/html") ? await response.text() : "" };
}

async function parallel(items, worker, concurrency = 6) {
  const output = new Array(items.length); let cursor = 0;
  await Promise.all(Array.from({ length: concurrency }, async () => {
    while (cursor < items.length) { const index = cursor++; output[index] = await worker(items[index], index); }
  }));
  return output;
}

const sitemapResponse = await fetchWithTimeout(`${origin}/sitemap.xml`);
if (!sitemapResponse.ok) throw new Error(`Sitemap returned ${sitemapResponse.status}`);
const sitemapXml = await sitemapResponse.text();
const sitemapPaths = [...sitemapXml.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => new URL(decode(match[1])).pathname);
const routes = [...new Set(["/", ...sitemapPaths, ...extraRoutes])].sort();
const sitemapSet = new Set(sitemapPaths);

const inventory = await parallel(routes, async path => {
  let response; let html;
  try { ({ response, html } = await get(path)); }
  catch (error) {
    const [section, pageType, intent] = classify(path);
    return { url: path, status: 0, section, page_type: pageType, indexable: false, canonical: null, sitemap: sitemapSet.has(path), title: "", meta_description: "", structured_data_types: [], content_status: "request-failed", data_verification_status: "not audited", internal_links_count: 0, thin: false, requires_more_content: false, primary_search_intent: intent, internal_links: [], audit_error: error instanceof Error ? error.message : String(error) };
  }
  const title = decode(html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || "");
  const description = meta(html, "description");
  const robots = meta(html, "robots").toLowerCase();
  const canonical = (html.match(/<link\b[^>]*rel=["']canonical["'][^>]*>/i)?.[0] || html.match(/<link\b[^>]*href=["'][^"']+["'][^>]*rel=["']canonical["'][^>]*>/i)?.[0] || "").match(/href=["']([^"']+)["']/i)?.[1] || "";
  const schemaTypes = [...new Set([...html.matchAll(/["']@type["']\s*:\s*["']([^"']+)["']/g)].map(match => match[1]))];
  const links = [...html.matchAll(/<a\b[^>]*href=["']([^"']+)["']/gi)].map(match => decode(match[1]));
  const [section, pageType, intent] = classify(path);
  const words = visibleText(html).split(/\s+/).filter(Boolean).length;
  const minimumWords = pageType === "reference detail" ? 70 : pageType === "tool" ? 90 : pageType === "error detail" ? 150 : pageType === "directory" ? 80 : 120;
  const indexable = response.status === 200 && !robots.includes("noindex");
  const thin = response.status === 200 && words < minimumWords;
  const verification = /source verified|verification status[^<]*(verified)|verified assignments/i.test(html) ? "verified data shown" : section === "telecom" || section === "mobile plans" ? "not asserted" : "not applicable";
  return {
    url: path, status: response.status, section, page_type: pageType, indexable,
    canonical: canonical || null, sitemap: sitemapSet.has(path), title, meta_description: description,
    structured_data_types: schemaTypes, content_status: response.status === 200 ? (thin ? "thin-review" : "useful") : "missing",
    data_verification_status: verification, word_count: words, internal_links_count: links.filter(link => link.startsWith("/")).length,
    thin, requires_more_content: thin && indexable, primary_search_intent: intent,
    internal_links: links.filter(link => link.startsWith("/")).map(link => link.split("#")[0]).filter(Boolean),
  };
});

const internalTargets = [...new Set(inventory.flatMap(item => item.internal_links))].filter(path =>
  !path.startsWith("/_next/") && !path.startsWith("/api/") && !path.startsWith("/cdn-cgi/"));
const auditedStatuses = new Map(inventory.map(item => [item.url, item.status]));
const statuses = await parallel(internalTargets, async path => {
  if (auditedStatuses.has(path)) return { url: path, status: auditedStatuses.get(path), location: null };
  try {
    const response = await fetchWithTimeout(`${origin}${path}`, { redirect: "manual" });
    return { url: path, status: response.status, location: response.headers.get("location") };
  } catch (error) {
    return { url: path, status: 0, location: null, error: error instanceof Error ? error.message : String(error) };
  }
});
const broken = statuses.filter(item => item.status === 0 || item.status >= 400);
const redirects = statuses.filter(item => item.status >= 300 && item.status < 400);
const expectedNotFound = await parallel(["/network/asn/999999999", "/this-route-must-not-exist"], async path => {
  try { const { response } = await get(path); return { url: path, status: response.status, passed: response.status === 404 }; }
  catch (error) { return { url: path, status: 0, passed: false, error: error instanceof Error ? error.message : String(error) }; }
}, 1);

const publicInventory = inventory.map(({ internal_links, ...item }) => item);
const totals = {
  total_routes: publicInventory.length,
  indexable_routes: publicInventory.filter(item => item.indexable).length,
  noindex_routes: publicInventory.filter(item => !item.indexable && item.status === 200).length,
  sitemap_routes: publicInventory.filter(item => item.sitemap).length,
  tool_pages: publicInventory.filter(item => item.page_type === "tool").length,
  error_pages: publicInventory.filter(item => item.section === "errors").length,
  telecom_pages: publicInventory.filter(item => item.section === "telecom").length,
  network_pages: publicInventory.filter(item => item.section === "network").length,
  developer_pages: publicInventory.filter(item => item.section === "developer").length,
  mobile_plan_pages: publicInventory.filter(item => item.section === "mobile plans").length,
  broken_internal_links: broken.length,
  internal_redirects: redirects.length,
};
const report = { generated_at: new Date().toISOString(), audited_origin: origin, totals, routes: publicInventory, broken_internal_links: broken, internal_redirects: redirects, expected_404_checks: expectedNotFound };
await writeFile(new URL("site-inventory.json", outputDir), `${JSON.stringify(report, null, 2)}\n`);
const table = publicInventory.map(item => `| \`${item.url}\` | ${item.status} | ${item.section} | ${item.indexable ? "yes" : "no"} | ${item.sitemap ? "yes" : "no"} | ${item.thin ? "yes" : "no"} |`).join("\n");
const markdown = `# SignalRate site inventory\n\nGenerated ${report.generated_at} by \`node scripts/audit-site.mjs\` against \`${origin}\`. The JSON companion is the machine-readable source of truth and includes titles, descriptions, canonicals, schema types, verification classification, intent, link counts, and content flags.\n\n## Totals\n\n${Object.entries(totals).map(([key, value]) => `- ${key.replaceAll("_", " ")}: ${value}`).join("\n")}\n\n## Route inventory\n\n| URL | HTTP | Section | Indexable | Sitemap | Thin |\n|---|---:|---|---|---|---|\n${table}\n\n## Link audit\n\nBroken internal targets: ${broken.length}. Internal redirects: ${redirects.length}. See \`site-inventory.json\` for exact results.\n`;
await writeFile(new URL("SITE_INVENTORY.md", outputDir), markdown);
console.log(JSON.stringify(totals, null, 2));
if (broken.length || expectedNotFound.some(item => !item.passed)) { console.error(JSON.stringify({ broken, expectedNotFound }, null, 2)); process.exitCode = 1; }
