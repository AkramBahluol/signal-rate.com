/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import { useMemo, useState } from "react";
import type { GrowthKind } from "@/lib/growth-tools";
import type { LocaleUrl } from "@/lib/i18n";
import { common } from "@/lib/i18n";
import {
  compound,
  convertUnit,
  dataUsage,
  exactAge,
  loan,
  percentage,
  shiftTime,
  timeDifference,
} from "@/lib/calculators";
import {
  entropyBits,
  passwordSpace,
  securePassword,
  strength,
} from "@/lib/password";
import { zonedWallTimeToUtc } from "@/lib/timezone";
import { publicApiUrl } from "@/lib/api";

const Field = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <label className="grid gap-2 text-sm font-semibold text-slate-700">
    <span>{label}</span>
    {children}
  </label>
);
const input =
  "rounded-xl border border-slate-300 bg-white px-3 py-3 text-base font-normal";
const fmt = (v: number, locale: string) =>
  new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(v);
export function GrowthToolClient({
  kind,
  locale,
}: {
  kind: GrowthKind;
  locale?: LocaleUrl;
}) {
  const c = common[locale ?? "en"];
  switch (kind) {
    case "password":
      return <Password c={c} />;
    case "percentage":
      return <Percentage c={c} locale={locale} />;
    case "age":
      return <Age c={c} locale={locale} />;
    case "time":
      return <Time c={c} />;
    case "loan":
      return <Loan c={c} locale={locale} />;
    case "compound":
      return <Compound c={c} locale={locale} />;
    case "unit":
      return <Unit c={c} locale={locale} />;
    case "data":
      return <Data c={c} locale={locale} />;
    case "ping":
      return <Ping c={c} />;
    case "timezone":
      return <Timezone c={c} locale={locale} />;
    case "certificate":
    case "csr":
      return <LocalPem kind={kind} c={c} />;
    case "down":
    case "chain":
    case "tls":
    case "https":
      return <RemoteCheck kind={kind} c={c} />;
    case "currency":
      return <Currency c={c} locale={locale} />;
    case "date":
      return <DateCalc c={c} locale={locale} />;
    default:
      return null;
  }
}
type Copy = (typeof common)[keyof typeof common];
function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      {children}
    </div>
  );
}
function Password({ c }: { c: Copy }) {
  const [length, setLength] = useState(20),
    [groups, setGroups] = useState(["upper", "lower", "numbers", "symbols"]),
    [exclude, setExclude] = useState(true),
    [value, setValue] = useState("");
  const space = passwordSpace(groups as never, exclude);
  const generate = () => {
    try {
      setValue(securePassword(length, space));
    } catch {
      setValue("");
    }
  };
  return (
    <Card>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Password length">
          <input
            className={input}
            type="number"
            min="4"
            max="128"
            value={length}
            onChange={(e) => setLength(+e.target.value)}
          />
        </Field>
        <fieldset>
          <legend className="text-sm font-semibold">Character groups</legend>
          <div className="mt-2 flex flex-wrap gap-3">
            {["upper", "lower", "numbers", "symbols"].map((g) => (
              <label key={g}>
                <input
                  type="checkbox"
                  checked={groups.includes(g)}
                  onChange={() =>
                    setGroups((x) =>
                      x.includes(g) ? x.filter((v) => v !== g) : [...x, g],
                    )
                  }
                />{" "}
                {g}
              </label>
            ))}
          </div>
        </fieldset>
      </div>
      <label className="mt-4 block">
        <input
          type="checkbox"
          checked={exclude}
          onChange={(e) => setExclude(e.target.checked)}
        />{" "}
        Exclude ambiguous characters
      </label>
      <div className="mt-5 flex gap-3">
        <button className="button-primary" onClick={generate}>
          {value ? "Regenerate" : "Generate Password"}
        </button>
        {value && (
          <button
            className="button-secondary"
            onClick={() => navigator.clipboard.writeText(value)}
          >
            {c.copy}
          </button>
        )}
      </div>
      {value && (
        <div
          className="mt-5 rounded-xl bg-slate-950 p-4 font-mono text-lg text-white break-all"
          dir="ltr"
        >
          {value}
          <p className="mt-2 text-xs text-slate-300">
            {length} characters · {space.length} symbols ·{" "}
            {entropyBits(length, space.length).toFixed(1)} bits ·{" "}
            {strength(entropyBits(length, space.length))}
          </p>
        </div>
      )}
    </Card>
  );
}
function Percentage({ c, locale }: { c: Copy; locale?: string }) {
  const [mode, setMode] = useState("of"),
    [a, setA] = useState(20),
    [b, setB] = useState(150);
  const result = percentage(mode, a, b);
  return (
    <Card>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Mode">
          <select
            className={input}
            value={mode}
            onChange={(e) => setMode(e.target.value)}
          >
            <option value="of">X% of Y</option>
            <option value="ratio">X is what % of Y</option>
            <option value="change">Percentage change</option>
            <option value="increase">Increase by %</option>
            <option value="decrease">Decrease by %</option>
          </select>
        </Field>
        <Field label="X / start">
          <input
            className={input}
            type="number"
            value={a}
            onChange={(e) => setA(+e.target.value)}
          />
        </Field>
        <Field label="Y / percent">
          <input
            className={input}
            type="number"
            value={b}
            onChange={(e) => setB(+e.target.value)}
          />
        </Field>
      </div>
      <p className="result-card mt-5 text-2xl font-bold">
        {c.result}: {result === null ? c.invalid : fmt(result, locale ?? "en")}
      </p>
      <p className="mt-3 text-sm text-slate-500">
        Formula:{" "}
        {mode === "of"
          ? "X × Y ÷ 100"
          : mode === "ratio"
            ? "X ÷ Y × 100"
            : "(new − old) ÷ |old| × 100"}
      </p>
    </Card>
  );
}
function Age({ c, locale }: { c: Copy; locale?: string }) {
  const [birth, setBirth] = useState("2000-01-01"),
    [on, setOn] = useState(new Date().toISOString().slice(0, 10));
  const r = exactAge(
    new Date(`${birth}T00:00:00Z`),
    new Date(`${on}T00:00:00Z`),
  );
  return (
    <Card>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Date of birth">
          <input
            className={input}
            type="date"
            value={birth}
            onChange={(e) => setBirth(e.target.value)}
          />
        </Field>
        <Field label="Calculate on">
          <input
            className={input}
            type="date"
            value={on}
            onChange={(e) => setOn(e.target.value)}
          />
        </Field>
      </div>
      <p className="result-card mt-5 text-xl font-bold">
        {r
          ? `${fmt(r.years, locale ?? "en")} years, ${r.months} months, ${r.days} days`
          : c.invalid}
      </p>
      {r && (
        <p className="mt-2 text-sm text-slate-500">
          {r.totalDays.toLocaleString(locale)} total days ·{" "}
          {r.totalWeeks.toLocaleString(locale)} whole weeks
        </p>
      )}
    </Card>
  );
}
function Time({ c }: { c: Copy }) {
  const [a, setA] = useState("08:30"),
    [b, setB] = useState("17:15"),
    [hours, setHours] = useState(2),
    [minutes, setMinutes] = useState(45),
    [mode, setMode] = useState("diff");
  const seconds = timeDifference(a, b);
  return (
    <Card>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Mode">
          <select
            className={input}
            value={mode}
            onChange={(e) => setMode(e.target.value)}
          >
            <option value="diff">Difference</option>
            <option value="add">Add duration</option>
            <option value="subtract">Subtract duration</option>
          </select>
        </Field>
        <Field label="Start time">
          <input
            className={input}
            type="time"
            step="1"
            value={a}
            onChange={(e) => setA(e.target.value)}
          />
        </Field>
        {mode === "diff" ? (
          <Field label="End time">
            <input
              className={input}
              type="time"
              step="1"
              value={b}
              onChange={(e) => setB(e.target.value)}
            />
          </Field>
        ) : (
          <>
            <Field label="Hours">
              <input
                className={input}
                type="number"
                value={hours}
                onChange={(e) => setHours(+e.target.value)}
              />
            </Field>
            <Field label="Minutes">
              <input
                className={input}
                type="number"
                value={minutes}
                onChange={(e) => setMinutes(+e.target.value)}
              />
            </Field>
          </>
        )}
      </div>
      <p className="result-card mt-5 text-xl font-bold">
        {c.result}:{" "}
        {mode === "diff"
          ? `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m ${seconds % 60}s`
          : shiftTime(
              a,
              (hours * 3600 + minutes * 60) * (mode === "subtract" ? -1 : 1),
            )}
      </p>
    </Card>
  );
}
function Loan({ c, locale }: { c: Copy; locale?: string }) {
  const [p, setP] = useState(100000),
    [rate, setRate] = useState(6),
    [months, setMonths] = useState(360);
  const r = loan(p, rate, months);
  return (
    <Card>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Loan amount">
          <input
            className={input}
            type="number"
            value={p}
            onChange={(e) => setP(+e.target.value)}
          />
        </Field>
        <Field label="Annual interest %">
          <input
            className={input}
            type="number"
            step=".01"
            value={rate}
            onChange={(e) => setRate(+e.target.value)}
          />
        </Field>
        <Field label="Term (months)">
          <input
            className={input}
            type="number"
            value={months}
            onChange={(e) => setMonths(+e.target.value)}
          />
        </Field>
      </div>
      {r && (
        <>
          <div className="result-card mt-5 grid gap-3 sm:grid-cols-3">
            <b>Monthly: {fmt(r.payment, locale ?? "en")}</b>
            <b>Interest: {fmt(r.totalInterest, locale ?? "en")}</b>
            <b>Total: {fmt(r.totalPayments, locale ?? "en")}</b>
          </div>
          <div className="mt-5 max-h-80 overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Principal</th>
                  <th>Interest</th>
                  <th>Balance</th>
                </tr>
              </thead>
              <tbody>
                {r.schedule.map((x) => (
                  <tr key={x.number}>
                    <td>{x.number}</td>
                    <td>{fmt(x.principal, locale ?? "en")}</td>
                    <td>{fmt(x.interest, locale ?? "en")}</td>
                    <td>{fmt(x.balance, locale ?? "en")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      <p className="mt-4 text-xs text-slate-500">
        Results are estimates and may differ from lender calculations, fees,
        insurance, taxes, or contractual terms.
      </p>
    </Card>
  );
}
function Compound({ c, locale }: { c: Copy; locale?: string }) {
  const [p, setP] = useState(10000),
    [rate, setRate] = useState(5),
    [years, setYears] = useState(10),
    [add, setAdd] = useState(100);
  const r = compound(p, rate, years, add, 12, 12);
  return (
    <Card>
      <div className="grid gap-4 sm:grid-cols-4">
        <Field label="Principal">
          <input
            className={input}
            type="number"
            value={p}
            onChange={(e) => setP(+e.target.value)}
          />
        </Field>
        <Field label="Annual rate %">
          <input
            className={input}
            type="number"
            value={rate}
            onChange={(e) => setRate(+e.target.value)}
          />
        </Field>
        <Field label="Years">
          <input
            className={input}
            type="number"
            value={years}
            onChange={(e) => setYears(+e.target.value)}
          />
        </Field>
        <Field label="Monthly contribution">
          <input
            className={input}
            type="number"
            value={add}
            onChange={(e) => setAdd(+e.target.value)}
          />
        </Field>
      </div>
      {r && (
        <p className="result-card mt-5 text-xl font-bold">
          Balance: {fmt(r.balance, locale ?? "en")} · Interest:{" "}
          {fmt(r.interest, locale ?? "en")}
        </p>
      )}
      <p className="mt-4 text-xs text-slate-500">
        Educational calculation only; not investment advice.
      </p>
    </Card>
  );
}
function Unit({ c, locale }: { c: Copy; locale?: string }) {
  const [cat, setCat] = useState<
      "length" | "mass" | "speed" | "data" | "temperature"
    >("length"),
    [value, setValue] = useState(1),
    [from, setFrom] = useState("km"),
    [to, setTo] = useState("mi");
  const opts = Object.keys(
    {
      length: { m: 0, km: 0, mi: 0, ft: 0 },
      mass: { kg: 0, lb: 0 },
      speed: { "m/s": 0, "km/h": 0, mph: 0, Mbps: 0, "MB/s": 0 },
      data: { B: 0, KB: 0, MB: 0, GB: 0, KiB: 0, MiB: 0, GiB: 0 },
      temperature: { C: 0, F: 0, K: 0 },
    }[cat],
  );
  const change = (v: typeof cat) => {
    setCat(v);
    const o = Object.keys(
      {
        length: { m: 0, km: 0, mi: 0, ft: 0 },
        mass: { kg: 0, lb: 0 },
        speed: { "m/s": 0, "km/h": 0, mph: 0, Mbps: 0, "MB/s": 0 },
        data: { B: 0, KB: 0, MB: 0, GB: 0, KiB: 0, MiB: 0, GiB: 0 },
        temperature: { C: 0, F: 0, K: 0 },
      }[v],
    );
    setFrom(o[0]);
    setTo(o[1]);
  };
  const r = convertUnit(cat, value, from, to);
  return (
    <Card>
      <div className="grid gap-4 sm:grid-cols-4">
        <Field label="Category">
          <select
            className={input}
            value={cat}
            onChange={(e) => change(e.target.value as typeof cat)}
          >
            {["length", "mass", "speed", "data", "temperature"].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </Field>
        <Field label="Value">
          <input
            className={input}
            type="number"
            value={value}
            onChange={(e) => setValue(+e.target.value)}
          />
        </Field>
        <Field label="From">
          <select
            className={input}
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          >
            {opts.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </Field>
        <Field label="To">
          <select
            className={input}
            value={to}
            onChange={(e) => setTo(e.target.value)}
          >
            {opts.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </Field>
      </div>
      <p className="result-card mt-5 text-xl font-bold">
        {c.result}: {r === null ? c.invalid : `${fmt(r, locale ?? "en")} ${to}`}
      </p>
    </Card>
  );
}
function Data({ c, locale }: { c: Copy; locale?: string }) {
  const [h, setH] = useState(2),
    [rate, setRate] = useState(3);
  const r = dataUsage(h, rate);
  return (
    <Card>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Hours per day">
          <input
            className={input}
            type="number"
            step=".1"
            value={h}
            onChange={(e) => setH(+e.target.value)}
          />
        </Field>
        <Field label="Estimated GB per hour">
          <input
            className={input}
            type="number"
            step=".1"
            value={rate}
            onChange={(e) => setRate(+e.target.value)}
          />
        </Field>
      </div>
      <p className="result-card mt-5 text-xl font-bold">
        {fmt(r.daily, locale ?? "en")} GB/day · {fmt(r.weekly, locale ?? "en")}{" "}
        GB/week · {fmt(r.monthly, locale ?? "en")} GB/month
      </p>
      <p className="mt-3 text-sm text-slate-500">
        Actual usage varies by service, codec, bitrate, device and network
        behavior.
      </p>
    </Card>
  );
}
function DateCalc({ c, locale }: { c: Copy; locale?: string }) {
  const [a, setA] = useState("2026-09-08"),
    [b, setB] = useState("2026-12-07");
  const days = Math.round(
    (new Date(`${b}T00:00Z`).getTime() - new Date(`${a}T00:00Z`).getTime()) /
      86400000,
  );
  return (
    <Card>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Start date">
          <input
            className={input}
            type="date"
            value={a}
            onChange={(e) => setA(e.target.value)}
          />
        </Field>
        <Field label="End date">
          <input
            className={input}
            type="date"
            value={b}
            onChange={(e) => setB(e.target.value)}
          />
        </Field>
      </div>
      <p className="result-card mt-5 text-xl font-bold">
        {c.result}:{" "}
        {Number.isFinite(days)
          ? `${fmt(days, locale ?? "en")} days`
          : c.invalid}
      </p>
    </Card>
  );
}
function Timezone({ c, locale }: { c: Copy; locale?: string }) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 16)),
    [zone, setZone] = useState("Africa/Tripoli"),
    [dest, setDest] = useState([
      "Europe/London",
      "America/New_York",
      "Asia/Tokyo",
    ]);
  const out = useMemo(() => {
    const d = zonedWallTimeToUtc(date, zone);
    return dest.map((z) => [
      z,
      new Intl.DateTimeFormat(locale ?? "en", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: z,
        timeZoneName: "short",
      }).format(d),
    ]);
  }, [date, dest, locale, zone]);
  return (
    <Card>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Date and time">
          <input
            className={input}
            type="datetime-local"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </Field>
        <Field label="Source timezone">
          <select
            className={input}
            value={zone}
            onChange={(e) => setZone(e.target.value)}
          >
            {[
              "Africa/Tripoli",
              "America/New_York",
              "Europe/London",
              "Asia/Tokyo",
              "Asia/Seoul",
            ].map((z) => (
              <option key={z}>{z}</option>
            ))}
          </select>
        </Field>
      </div>
      <div className="mt-5 grid gap-3">
        {out.map(([z, v]) => (
          <p className="result-card" key={z}>
            <b dir="ltr">{z}</b>
            <br />
            {v}
          </p>
        ))}
      </div>
      <p className="mt-3 text-xs text-slate-500">
        Uses browser IANA timezone data, including DST. The entered wall time is
        interpreted by the browser; verify critical scheduling.
      </p>
    </Card>
  );
}
function Ping({ c }: { c: Copy }) {
  const [running, setRunning] = useState(false),
    [result, setResult] = useState<{
      latency: number;
      jitter: number;
      min: number;
    } | null>(null);
  async function run() {
    setRunning(true);
    const samples: number[] = [];
    for (let i = 0; i < 8; i++) {
      const t = performance.now();
      try {
        await fetch(
          `https://speed.cloudflare.com/__down?bytes=0&t=${Date.now()}-${i}`,
          { cache: "no-store", mode: "cors" },
        );
        samples.push(performance.now() - t);
      } catch {}
    }
    setRunning(false);
    if (samples.length) {
      const avg = samples.reduce((a, b) => a + b) / samples.length;
      const jitter =
        samples.slice(1).reduce((s, x, i) => s + Math.abs(x - samples[i]), 0) /
        Math.max(1, samples.length - 1);
      setResult({ latency: avg, jitter, min: Math.min(...samples) });
    }
  }
  return (
    <Card>
      <button className="button-primary" disabled={running} onClick={run}>
        {running ? "Testing…" : result ? "Retest" : "Start Latency Test"}
      </button>
      {result && (
        <p className="result-card mt-5 text-xl font-bold">
          Latency {result.latency.toFixed(1)} ms · Jitter{" "}
          {result.jitter.toFixed(1)} ms · Min {result.min.toFixed(1)} ms
        </p>
      )}
      <p className="mt-3 text-sm text-slate-500">
        This measures browser network latency to Cloudflare infrastructure, not
        ICMP ping to an arbitrary server. Results are not stored.
      </p>
    </Card>
  );
}
function RemoteCheck({ kind, c }: { kind: GrowthKind; c: Copy }) {
  const [target, setTarget] = useState("example.com"),
    [busy, setBusy] = useState(false),
    [result, setResult] = useState<unknown>();
  async function run() {
    setBusy(true);
    setResult(undefined);
    try {
      const path = ({
        down: "availability",
        chain: "certificate-chain",
        tls: "tls-versions",
        https: "https-health",
      } as Partial<Record<GrowthKind, string>>)[kind]!;
      const res = await fetch(
        `${publicApiUrl}/api/v1/network/${path}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ target }),
        },
      );
      setResult(await res.json());
    } catch {
      setResult({ message: "Unable to perform check." });
    } finally {
      setBusy(false);
    }
  }
  return (
    <Card>
      <Field label="Public domain or URL">
        <input
          className={input}
          dir="ltr"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
        />
      </Field>
      <button className="button-primary mt-4" disabled={busy} onClick={run}>
        {busy ? "Checking…" : c.start}
      </button>
      {result !== undefined && (
        <pre
          className="mt-5 max-h-96 overflow-auto rounded-xl bg-slate-950 p-4 text-sm text-emerald-200"
          dir="ltr"
        >
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </Card>
  );
}
function LocalPem({ kind, c }: { kind: GrowthKind; c: Copy }) {
  const [text, setText] = useState(""),
    [result, setResult] = useState<unknown>(),
    [busy, setBusy] = useState(false);
  async function decode() {
    setBusy(true);
    try {
      const mod = await import("@peculiar/x509");
      if (kind === "certificate") {
        const cert = new mod.X509Certificate(text);
        setResult({
          serialNumber: cert.serialNumber,
          subject: cert.subject,
          issuer: cert.issuer,
          notBefore: cert.notBefore,
          notAfter: cert.notAfter,
          signatureAlgorithm: cert.signatureAlgorithm.name,
          publicKeyAlgorithm: cert.publicKey.algorithm.name,
          fingerprint: await cert.getThumbprint(),
        });
      } else {
        const csr = new mod.Pkcs10CertificateRequest(text);
        setResult({
          subject: csr.subject,
          signatureAlgorithm: csr.signatureAlgorithm.name,
          publicKeyAlgorithm: csr.publicKey.algorithm.name,
          signatureValid: await csr.verify(),
        });
      }
    } catch {
      setResult({ error: "Certificate or CSR could not be parsed." });
    } finally {
      setBusy(false);
    }
  }
  return (
    <Card>
      <Field
        label={kind === "csr" ? "PKCS#10 CSR (PEM)" : "X.509 certificate (PEM)"}
      >
        <textarea
          className={`${input} min-h-52 font-mono`}
          dir="ltr"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </Field>
      <button
        className="button-primary mt-4"
        onClick={decode}
        disabled={busy || !text}
      >
        {c.start}
      </button>
      {result !== undefined && (
        <pre
          className="mt-5 overflow-auto rounded-xl bg-slate-950 p-4 text-sm text-emerald-200"
          dir="ltr"
        >
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
      <p className="mt-3 text-xs text-slate-500">
        Processed locally in this browser. The PEM text is not sent to
        SignalRate.
      </p>
    </Card>
  );
}
function Currency({ c, locale }: { c: Copy; locale?: string }) {
  const [amount, setAmount] = useState(100),
    [from, setFrom] = useState("USD"),
    [to, setTo] = useState("EUR"),
    [result, setResult] = useState<Record<string, unknown>>();
  async function run() {
    try {
      const r = await fetch(`${publicApiUrl}/api/v1/exchange-rates/convert`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ amount, from, to }),
      });
      setResult(await r.json());
    } catch {
      setResult({ message: "Exchange rates are temporarily unavailable." });
    }
  }
  return (
    <Card>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Amount">
          <input
            className={input}
            type="number"
            value={amount}
            onChange={(e) => setAmount(+e.target.value)}
          />
        </Field>
        <Field label="From">
          <input
            className={input}
            value={from}
            onChange={(e) => setFrom(e.target.value.toUpperCase())}
          />
        </Field>
        <Field label="To">
          <input
            className={input}
            value={to}
            onChange={(e) => setTo(e.target.value.toUpperCase())}
          />
        </Field>
      </div>
      <button className="button-primary mt-4" onClick={run}>
        {c.calculate}
      </button>
      {result && (
        <pre className="result-card mt-5 overflow-auto" dir="ltr">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
      <p className="mt-3 text-xs text-slate-500">
        ECB reference rates are not live trading rates.
      </p>
    </Card>
  );
}
