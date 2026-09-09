"use client";

import { useEffect, useRef, useState } from "react";
import type SpeedTest from "@cloudflare/speedtest";
import type { MeasurementSummary, MeasurementType } from "@cloudflare/speedtest";
import { speedTestMeasurements, toDisplayMetrics, type SpeedTestProfile } from "@/lib/speed-test";
import { useLocaleCopy } from "@/components/use-locale";

type Engine = InstanceType<typeof SpeedTest>;
type Status = "idle" | "loading" | "running" | "finished" | "error";

const phaseNames: Partial<Record<MeasurementType, string>> = {
  latency: "Measuring latency",
  download: "Measuring download speed",
  upload: "Measuring upload speed",
};

function Metric({ label, value, unit }: { label: string; value?: number; unit: string }) {
  return <div className="rounded-2xl border bg-white p-5 text-center shadow-sm"><p className="text-sm font-semibold text-slate-500">{label}</p><p className="mt-2 text-3xl font-bold tabular-nums text-[#10213b]">{value === undefined ? "—" : value.toFixed(value >= 100 ? 0 : value >= 10 ? 1 : 2)}</p><p className="mt-1 text-xs uppercase tracking-wider text-slate-400">{unit}</p></div>;
}

export function InternetSpeedTest() {
  const {locale,copy}=useLocaleCopy();
  const engineRef = useRef<Engine | null>(null);
  const mountedRef = useRef(true);
  const [status, setStatus] = useState<Status>("idle");
  const [phase, setPhase] = useState("Ready when you are");
  const [summary, setSummary] = useState<MeasurementSummary>({});
  const [error, setError] = useState("");
  const metrics = toDisplayMetrics(summary);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      engineRef.current?.pause();
    };
  }, []);

  async function start(profile: SpeedTestProfile) {
    if (status === "loading" || status === "running") return;
    setStatus("loading");
    setPhase("Loading the Cloudflare test engine");
    setSummary({});
    setError("");
    try {
      const { default: CloudflareSpeedTest } = await import("@cloudflare/speedtest");
      if (!mountedRef.current) return;
      const engine = new CloudflareSpeedTest({
        autoStart: false,
        measurements: speedTestMeasurements[profile],
        logAimApiUrl: null,
        logMeasurementApiUrl: null,
        measureDownloadLoadedLatency: true,
        measureUploadLoadedLatency: true,
      });
      engineRef.current = engine;
      engine.onPhaseChange = ({ measurement }) => {
        if (!mountedRef.current) return;
        setPhase(phaseNames[measurement.type] ?? "Running connection test");
      };
      engine.onResultsChange = () => {
        if (mountedRef.current) setSummary(engine.results.getSummary());
      };
      engine.onError = message => {
        if (!mountedRef.current) return;
        setError(message || "The speed test could not complete. Check your connection and try again.");
        setPhase("One measurement failed; continuing");
      };
      engine.onFinish = results => {
        if (!mountedRef.current) return;
        const finishedSummary = results.getSummary();
        setSummary(finishedSummary);
        const hasResult = finishedSummary.download !== undefined || finishedSummary.upload !== undefined || finishedSummary.latency !== undefined;
        setPhase(hasResult ? "Test complete" : "Test could not produce a result");
        setStatus(hasResult ? "finished" : "error");
      };
      setStatus("running");
      engine.play();
    } catch {
      if (!mountedRef.current) return;
      setError("The speed test engine could not load. Check your connection and try again.");
      setPhase("Test unavailable");
      setStatus("error");
    }
  }

  const busy = status === "loading" || status === "running";
  const localized={en:["Start Quick Test","Start Full Test","Testing…"],ja:["クイックテストを開始","フルテストを開始","テスト中…"],"pt-br":["Iniciar teste rápido","Iniciar teste completo","Testando…"],de:["Schnelltest starten","Vollständigen Test starten","Test läuft…"],es:["Iniciar prueba rápida","Iniciar prueba completa","Probando…"],hi:["त्वरित परीक्षण शुरू करें","पूर्ण परीक्षण शुरू करें","परीक्षण जारी…"],fr:["Démarrer le test rapide","Démarrer le test complet","Test en cours…"],ko:["빠른 테스트 시작","전체 테스트 시작","테스트 중…"],ar:["ابدأ الاختبار السريع","ابدأ الاختبار الكامل","جارٍ الاختبار…"],id:["Mulai tes cepat","Mulai tes lengkap","Menguji…"]}[locale];
  return <section className="mt-8 rounded-3xl border bg-slate-50 p-5 sm:p-8" aria-labelledby="speed-test-controls">
    <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div><h2 id="speed-test-controls" className="text-2xl font-bold">Run a browser speed test</h2><p className="mt-2 max-w-2xl leading-7 text-slate-600">Choose Quick for a lighter estimate or Full for a broader sample. Close downloads, calls, and streaming for a more representative result.</p></div>
      <div className="flex shrink-0 flex-wrap gap-3">
        <button type="button" disabled={busy} onClick={() => start("quick")} className="rounded-xl bg-[#315efb] px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">{busy ? localized[2] : localized[0]}</button>
        <button type="button" disabled={busy} onClick={() => start("full")} className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold disabled:cursor-not-allowed disabled:opacity-50">{localized[1]}</button>
      </div>
    </div>
    <div className="mt-6 flex items-center gap-3 rounded-xl bg-white px-4 py-3 text-sm" role="status" aria-live="polite"><span className={`h-2.5 w-2.5 rounded-full ${busy ? "animate-pulse bg-blue-500" : status === "finished" ? "bg-emerald-500" : status === "error" ? "bg-rose-500" : "bg-slate-300"}`}/><span className="font-semibold">{phase}</span></div>
    {error && <p role="alert" className="mt-4 rounded-xl bg-rose-50 p-4 text-sm text-rose-800">{error}</p>}
    <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Metric label="Download" value={metrics.downloadMbps} unit="Mbps"/>
      <Metric label="Upload" value={metrics.uploadMbps} unit="Mbps"/>
      <Metric label="Ping / latency" value={metrics.latencyMs} unit="ms"/>
      <Metric label="Jitter" value={metrics.jitterMs} unit="ms"/>
    </div>
    <p className="mt-5 text-sm leading-6 text-slate-500"><strong>{copy.privacy}:</strong> Test traffic travels directly between this browser and Cloudflare&apos;s speed-test endpoints; it does not pass through the SignalRate backend. SignalRate does not save the inputs or results. The test consumes data, and a Full Test may use substantially more than a Quick Test.</p>
  </section>;
}
