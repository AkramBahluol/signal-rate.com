import type { MeasurementConfig, MeasurementSummary } from "@cloudflare/speedtest";

export type SpeedTestProfile = "quick" | "full";

const quickMeasurements: MeasurementConfig[] = [
  { type: "latency", numPackets: 10 },
  { type: "download", bytes: 100_000, count: 4, bypassMinDuration: true },
  { type: "download", bytes: 1_000_000, count: 4 },
  { type: "download", bytes: 10_000_000, count: 2 },
  { type: "upload", bytes: 100_000, count: 4, bypassMinDuration: true },
  { type: "upload", bytes: 1_000_000, count: 4 },
  { type: "upload", bytes: 10_000_000, count: 2 },
];

const fullMeasurements: MeasurementConfig[] = [
  { type: "latency", numPackets: 20 },
  { type: "download", bytes: 100_000, count: 5, bypassMinDuration: true },
  { type: "download", bytes: 1_000_000, count: 6 },
  { type: "download", bytes: 10_000_000, count: 4 },
  { type: "download", bytes: 25_000_000, count: 3 },
  { type: "download", bytes: 100_000_000, count: 2 },
  { type: "upload", bytes: 100_000, count: 5, bypassMinDuration: true },
  { type: "upload", bytes: 1_000_000, count: 6 },
  { type: "upload", bytes: 10_000_000, count: 4 },
  { type: "upload", bytes: 25_000_000, count: 3 },
  { type: "upload", bytes: 50_000_000, count: 2 },
];

export const speedTestMeasurements: Record<SpeedTestProfile, MeasurementConfig[]> = {
  quick: quickMeasurements,
  full: fullMeasurements,
};

export type DisplayMetrics = {
  downloadMbps?: number;
  uploadMbps?: number;
  latencyMs?: number;
  jitterMs?: number;
};

function finite(value: number | undefined): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

export function toDisplayMetrics(summary: MeasurementSummary): DisplayMetrics {
  const download = finite(summary.download);
  const upload = finite(summary.upload);
  return {
    downloadMbps: download === undefined ? undefined : download / 1_000_000,
    uploadMbps: upload === undefined ? undefined : upload / 1_000_000,
    latencyMs: finite(summary.latency),
    jitterMs: finite(summary.jitter),
  };
}
