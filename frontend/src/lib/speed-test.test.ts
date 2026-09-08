import { describe, expect, it } from "vitest";
import { speedTestMeasurements, toDisplayMetrics } from "./speed-test";

describe("speed test configuration", () => {
  it("converts Cloudflare bit-per-second results to Mbps", () => {
    expect(toDisplayMetrics({ download: 125_000_000, upload: 22_500_000, latency: 14.25, jitter: 2.5 })).toEqual({
      downloadMbps: 125,
      uploadMbps: 22.5,
      latencyMs: 14.25,
      jitterMs: 2.5,
    });
  });

  it("keeps unavailable metrics absent instead of fabricating values", () => {
    expect(toDisplayMetrics({})).toEqual({
      downloadMbps: undefined,
      uploadMbps: undefined,
      latencyMs: undefined,
      jitterMs: undefined,
    });
  });

  it("defines clean quick and full profiles without unsupported packet loss", () => {
    expect(speedTestMeasurements.quick.some(step => step.type === "latency")).toBe(true);
    expect(speedTestMeasurements.quick.some(step => step.type === "download")).toBe(true);
    expect(speedTestMeasurements.quick.some(step => step.type === "upload")).toBe(true);
    expect(speedTestMeasurements.full.length).toBeGreaterThan(speedTestMeasurements.quick.length);
    expect([...speedTestMeasurements.quick, ...speedTestMeasurements.full].some(step => step.type === "packetLoss")).toBe(false);
  });
});
