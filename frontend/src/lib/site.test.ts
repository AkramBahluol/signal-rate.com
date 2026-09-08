import { afterEach, describe, expect, it, vi } from "vitest";

const originalEnabled = process.env.NEXT_PUBLIC_ADSENSE_ENABLED;
const originalClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

afterEach(() => {
  if (originalEnabled === undefined) delete process.env.NEXT_PUBLIC_ADSENSE_ENABLED;
  else process.env.NEXT_PUBLIC_ADSENSE_ENABLED = originalEnabled;
  if (originalClient === undefined) delete process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
  else process.env.NEXT_PUBLIC_ADSENSE_CLIENT = originalClient;
  vi.resetModules();
});

describe("AdSense environment gate", () => {
  it("stays disabled without explicit configuration", async () => {
    delete process.env.NEXT_PUBLIC_ADSENSE_ENABLED;
    delete process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
    vi.resetModules();
    expect((await import("./site")).adsEnabled).toBe(false);
  });

  it("enables only with a valid explicitly configured client", async () => {
    process.env.NEXT_PUBLIC_ADSENSE_ENABLED = "true";
    process.env.NEXT_PUBLIC_ADSENSE_CLIENT = "ca-pub-9743834422526607";
    vi.resetModules();
    expect((await import("./site")).adsEnabled).toBe(true);
  });

  it("rejects malformed client identifiers", async () => {
    process.env.NEXT_PUBLIC_ADSENSE_ENABLED = "true";
    process.env.NEXT_PUBLIC_ADSENSE_CLIENT = "ca-pub-placeholder";
    vi.resetModules();
    expect((await import("./site")).adsEnabled).toBe(false);
  });
});
