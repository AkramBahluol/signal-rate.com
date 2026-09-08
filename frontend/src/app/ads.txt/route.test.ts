import { afterEach, describe, expect, it } from "vitest";
import { GET } from "./route";

const original = process.env.ADS_TXT_LINE;
afterEach(() => {
  if (original === undefined) delete process.env.ADS_TXT_LINE;
  else process.env.ADS_TXT_LINE = original;
});

describe("ads.txt readiness", () => {
  it("stays unavailable without a real seller record", async () => {
    delete process.env.ADS_TXT_LINE;
    const response = GET();
    expect(response.status).toBe(404);
    expect(await response.text()).not.toContain("pub-000");
  });

  it("rejects fake or malformed records", () => {
    process.env.ADS_TXT_LINE = "google.com, pub-placeholder, DIRECT, f08c47fec0942fa0";
    expect(GET().status).toBe(404);
  });

  it("serves an explicitly configured seller record", async () => {
    process.env.ADS_TXT_LINE = `google.com, pub-${"1".repeat(16)}, DIRECT, f08c47fec0942fa0`;
    const response = GET();
    expect(response.status).toBe(200);
    expect(await response.text()).toBe(`${process.env.ADS_TXT_LINE}\n`);
  });

  it("serves the reviewed SignalRate Google seller record", async () => {
    process.env.ADS_TXT_LINE = "google.com, pub-9743834422526607, DIRECT, f08c47fec0942fa0";
    const response = GET();
    expect(response.status).toBe(200);
    expect(await response.text()).toBe(`${process.env.ADS_TXT_LINE}\n`);
  });
});
