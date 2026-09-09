import { describe, expect, it } from "vitest";
import { developerTools } from "./developer-tools";
import { flagshipMetadata, flagshipPaths, flagshipSeoPages } from "./flagship-seo";
import { growthTools } from "./growth-tools";
import { jsonLd } from "./json-ld";
import { networkTools } from "./network-tools";

const expectedPaths = [
  "/network/speed-test",
  "/network/what-is-my-ip",
  "/developer-tools/password-generator",
  "/tools/time-zone-converter",
  "/network/is-it-down",
  "/network/ping-test",
  "/calculators/percentage-calculator",
  "/calculators/currency-converter",
  "/network/ssl-checker",
  "/developer-tools/json-formatter",
];

describe("flagship SEO foundation", () => {
  it("covers exactly the ten selected canonical pages", () => {
    expect([...flagshipPaths]).toEqual(expectedPaths);
    expect(new Set(flagshipSeoPages.map((page) => page.primaryIntent)).size).toBe(10);
    expect(new Set(flagshipSeoPages.map((page) => page.title)).size).toBe(10);
    expect(new Set(flagshipSeoPages.map((page) => page.description)).size).toBe(10);
  });

  it("provides useful explanations, FAQs, and contextual internal links", () => {
    const knownPaths = new Set([
      ...growthTools.map((tool) => tool.path),
      ...networkTools.map((tool) => tool.path),
      ...developerTools.map((tool) => `/developer-tools/${tool.slug}`),
    ]);
    for (const page of flagshipSeoPages) {
      expect(page.description.length).toBeGreaterThanOrEqual(100);
      expect(page.sections.length).toBeGreaterThanOrEqual(2);
      expect(page.faqs.length).toBeGreaterThanOrEqual(3);
      expect(page.related.length).toBeGreaterThanOrEqual(3);
      expect(page.related.every((related) => knownPaths.has(related.path))).toBe(true);
      expect(page.related.every((related) => related.path !== page.path)).toBe(true);
    }
  });

  it("uses a self-canonical without false localized alternates", () => {
    for (const path of expectedPaths) {
      const metadata = flagshipMetadata(path);
      expect(metadata?.alternates).toEqual({ canonical: path });
    }
  });

  it("escapes less-than characters in structured data", () => {
    expect(jsonLd({ value: "</script>" })).toContain("\\u003c/script>");
  });
});
