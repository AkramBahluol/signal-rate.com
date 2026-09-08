/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import { createContext, useContext, useMemo, useState } from "react";
import type { GrowthKind } from "@/lib/growth-tools";
import type { LocaleUrl } from "@/lib/i18n";
import { common } from "@/lib/i18n";
import {
  addCalendar,
  compound,
  convertUnit,
  dataUsage,
  dateDifference,
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
import { NetworkTool } from "@/components/network/network-tool";

const LocaleContext = createContext<string>("en");
const labels: Record<string, Record<string, string>> = {
  ar: {
    Mode: "الوضع",
    "Password length": "طول كلمة المرور",
    "X / start": "القيمة X / البداية",
    "Y / percent": "القيمة Y / النسبة",
    "Date of birth": "تاريخ الميلاد",
    "Calculate on": "الحساب في تاريخ",
    "Start time": "وقت البداية",
    "End time": "وقت النهاية",
    Hours: "الساعات",
    Minutes: "الدقائق",
    "Loan amount": "مبلغ القرض",
    "Annual interest %": "الفائدة السنوية %",
    "Term (months)": "المدة (بالأشهر)",
    Principal: "رأس المال",
    Years: "السنوات",
    "Monthly contribution": "المساهمة الشهرية",
    Category: "الفئة",
    Value: "القيمة",
    From: "من",
    To: "إلى",
    "Hours per day": "ساعات يوميًا",
    "Estimated GB per hour": "جيجابايت تقديرية لكل ساعة",
    "Start date": "تاريخ البداية",
    "End date": "تاريخ النهاية",
    "Date and time": "التاريخ والوقت",
    "Source timezone": "المنطقة الزمنية الأصلية",
    "Public domain or URL": "نطاق أو رابط عام",
    Amount: "المبلغ",
  },
  es: {
    Mode: "Modo",
    "Password length": "Longitud de contraseña",
    "Date of birth": "Fecha de nacimiento",
    "Calculate on": "Calcular en la fecha",
    "Start time": "Hora inicial",
    "End time": "Hora final",
    Hours: "Horas",
    Minutes: "Minutos",
    "Loan amount": "Importe del préstamo",
    "Annual interest %": "Interés anual %",
    "Term (months)": "Plazo (meses)",
    Principal: "Capital inicial",
    Years: "Años",
    "Monthly contribution": "Aportación mensual",
    Category: "Categoría",
    Value: "Valor",
    From: "De",
    To: "A",
    "Hours per day": "Horas al día",
    "Estimated GB per hour": "GB estimados por hora",
    "Start date": "Fecha inicial",
    "End date": "Fecha final",
    "Date and time": "Fecha y hora",
    "Source timezone": "Zona horaria de origen",
    "Public domain or URL": "Dominio o URL pública",
    Amount: "Importe",
  },
  fr: {
    Mode: "Mode",
    "Password length": "Longueur du mot de passe",
    "Date of birth": "Date de naissance",
    "Calculate on": "Calculer à la date",
    "Start time": "Heure de début",
    "End time": "Heure de fin",
    Hours: "Heures",
    Minutes: "Minutes",
    "Loan amount": "Montant du prêt",
    "Annual interest %": "Taux annuel %",
    "Term (months)": "Durée (mois)",
    Principal: "Capital initial",
    Years: "Années",
    "Monthly contribution": "Versement mensuel",
    Category: "Catégorie",
    Value: "Valeur",
    From: "De",
    To: "Vers",
    "Hours per day": "Heures par jour",
    "Estimated GB per hour": "Go estimés par heure",
    "Start date": "Date de début",
    "End date": "Date de fin",
    "Date and time": "Date et heure",
    "Source timezone": "Fuseau horaire source",
    "Public domain or URL": "Domaine ou URL publique",
    Amount: "Montant",
  },
  de: {
    Mode: "Modus",
    "Password length": "Passwortlänge",
    "Date of birth": "Geburtsdatum",
    "Calculate on": "Berechnen am",
    "Start time": "Startzeit",
    "End time": "Endzeit",
    Hours: "Stunden",
    Minutes: "Minuten",
    "Loan amount": "Kreditbetrag",
    "Annual interest %": "Jahreszins %",
    "Term (months)": "Laufzeit (Monate)",
    Principal: "Anfangskapital",
    Years: "Jahre",
    "Monthly contribution": "Monatliche Einzahlung",
    Category: "Kategorie",
    Value: "Wert",
    From: "Von",
    To: "Nach",
    "Hours per day": "Stunden pro Tag",
    "Estimated GB per hour": "Geschätzte GB pro Stunde",
    "Start date": "Startdatum",
    "End date": "Enddatum",
    "Date and time": "Datum und Uhrzeit",
    "Source timezone": "Ausgangszeitzone",
    "Public domain or URL": "Öffentliche Domain oder URL",
    Amount: "Betrag",
  },
  "pt-br": {
    Mode: "Modo",
    "Password length": "Tamanho da senha",
    "Date of birth": "Data de nascimento",
    "Calculate on": "Calcular na data",
    "Start time": "Hora inicial",
    "End time": "Hora final",
    Hours: "Horas",
    Minutes: "Minutos",
    "Loan amount": "Valor do empréstimo",
    "Annual interest %": "Juros anuais %",
    "Term (months)": "Prazo (meses)",
    Principal: "Capital inicial",
    Years: "Anos",
    "Monthly contribution": "Contribuição mensal",
    Category: "Categoria",
    Value: "Valor",
    From: "De",
    To: "Para",
    "Hours per day": "Horas por dia",
    "Estimated GB per hour": "GB estimados por hora",
    "Start date": "Data inicial",
    "End date": "Data final",
    "Date and time": "Data e hora",
    "Source timezone": "Fuso horário de origem",
    "Public domain or URL": "Domínio ou URL pública",
    Amount: "Valor",
  },
  ja: {
    Mode: "モード",
    "Password length": "パスワードの長さ",
    "Date of birth": "生年月日",
    "Calculate on": "計算日",
    "Start time": "開始時刻",
    "End time": "終了時刻",
    Hours: "時間",
    Minutes: "分",
    "Loan amount": "借入額",
    "Annual interest %": "年利 %",
    "Term (months)": "期間（月）",
    Principal: "元金",
    Years: "年数",
    "Monthly contribution": "毎月の積立",
    Category: "種類",
    Value: "値",
    From: "変換元",
    To: "変換先",
    "Hours per day": "1日あたりの時間",
    "Estimated GB per hour": "1時間あたりの推定GB",
    "Start date": "開始日",
    "End date": "終了日",
    "Date and time": "日時",
    "Source timezone": "変換元タイムゾーン",
    "Public domain or URL": "公開ドメインまたはURL",
    Amount: "金額",
  },
  hi: {
    Mode: "मोड",
    "Password length": "पासवर्ड की लंबाई",
    "Date of birth": "जन्म तिथि",
    "Calculate on": "इस तिथि पर आयु",
    "Start time": "आरंभ समय",
    "End time": "समाप्ति समय",
    Hours: "घंटे",
    Minutes: "मिनट",
    "Loan amount": "ऋण राशि",
    "Annual interest %": "वार्षिक ब्याज %",
    "Term (months)": "अवधि (महीने)",
    Principal: "मूलधन",
    Years: "वर्ष",
    "Monthly contribution": "मासिक योगदान",
    Category: "श्रेणी",
    Value: "मान",
    From: "से",
    To: "तक",
    "Hours per day": "प्रति दिन घंटे",
    "Estimated GB per hour": "प्रति घंटे अनुमानित GB",
    "Start date": "आरंभ तिथि",
    "End date": "समाप्ति तिथि",
    "Date and time": "तारीख और समय",
    "Source timezone": "स्रोत समय क्षेत्र",
    "Public domain or URL": "सार्वजनिक डोमेन या URL",
    Amount: "राशि",
  },
  ko: {
    Mode: "모드",
    "Password length": "비밀번호 길이",
    "Date of birth": "생년월일",
    "Calculate on": "기준 날짜",
    "Start time": "시작 시간",
    "End time": "종료 시간",
    Hours: "시간",
    Minutes: "분",
    "Loan amount": "대출 금액",
    "Annual interest %": "연 이율 %",
    "Term (months)": "기간(개월)",
    Principal: "원금",
    Years: "연수",
    "Monthly contribution": "월 납입액",
    Category: "범주",
    Value: "값",
    From: "변환 전",
    To: "변환 후",
    "Hours per day": "일일 시간",
    "Estimated GB per hour": "시간당 예상 GB",
    "Start date": "시작 날짜",
    "End date": "종료 날짜",
    "Date and time": "날짜 및 시간",
    "Source timezone": "원본 시간대",
    "Public domain or URL": "공개 도메인 또는 URL",
    Amount: "금액",
  },
  id: {
    Mode: "Mode",
    "Password length": "Panjang kata sandi",
    "Date of birth": "Tanggal lahir",
    "Calculate on": "Hitung pada tanggal",
    "Start time": "Waktu mulai",
    "End time": "Waktu selesai",
    Hours: "Jam",
    Minutes: "Menit",
    "Loan amount": "Jumlah pinjaman",
    "Annual interest %": "Bunga tahunan %",
    "Term (months)": "Jangka waktu (bulan)",
    Principal: "Modal awal",
    Years: "Tahun",
    "Monthly contribution": "Kontribusi bulanan",
    Category: "Kategori",
    Value: "Nilai",
    From: "Dari",
    To: "Ke",
    "Hours per day": "Jam per hari",
    "Estimated GB per hour": "Perkiraan GB per jam",
    "Start date": "Tanggal mulai",
    "End date": "Tanggal akhir",
    "Date and time": "Tanggal dan waktu",
    "Source timezone": "Zona waktu asal",
    "Public domain or URL": "Domain atau URL publik",
    Amount: "Jumlah",
  },
};
const translatedLabel = (locale: string, label: string) =>
  labels[locale]?.[label] ?? label;
const Field = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => {
  const locale = useContext(LocaleContext);
  return (
    <label className="grid gap-2 text-sm font-semibold text-slate-700">
      <span>{translatedLabel(locale, label)}</span>
      {children}
    </label>
  );
};
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
  return (
    <LocaleContext.Provider value={locale ?? "en"}>
      <GrowthToolInner kind={kind} locale={locale} />
    </LocaleContext.Provider>
  );
}
function GrowthToolInner({
  kind,
  locale,
}: {
  kind: GrowthKind;
  locale?: LocaleUrl;
}) {
  const c = common[locale ?? "en"];
  if (kind === "subnet-reuse") return <NetworkTool mode="subnet" />;
  if (kind === "bandwidth-reuse") return <NetworkTool mode="bandwidth" />;
  if (kind === "download-reuse") return <NetworkTool mode="download-time" />;
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
  const unitChoices = {
    length: ["m", "km", "mi", "ft"],
    area: ["m²", "km²", "ft²", "acre"],
    volume: ["L", "mL", "m³", "gal (US)"],
    mass: ["kg", "lb"],
    temperature: ["C", "F", "K"],
    speed: ["m/s", "km/h", "mph", "Mbps", "MB/s"],
    time: ["s", "min", "h", "day"],
    data: ["B", "KB", "MB", "GB", "KiB", "MiB", "GiB"],
    energy: ["J", "kJ", "Wh", "kWh"],
    power: ["W", "kW", "hp"],
    pressure: ["Pa", "kPa", "bar", "psi"],
  } as const;
  const [cat, setCat] = useState<keyof typeof unitChoices>("length"),
    [value, setValue] = useState(1),
    [from, setFrom] = useState("km"),
    [to, setTo] = useState("mi");
  const opts = [...unitChoices[cat]];
  const change = (v: typeof cat) => {
    setCat(v);
    const o = [...unitChoices[v]];
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
            {Object.keys(unitChoices).map((v) => (
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
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Activity / quality">
          <select
            className={input}
            onChange={(e) => setRate(+e.target.value)}
            value={rate}
          >
            <option value="0.06">Web / social (estimate)</option>
            <option value="0.15">Music streaming</option>
            <option value="0.7">Video 480p</option>
            <option value="1.5">Video 720p</option>
            <option value="3">Video 1080p</option>
            <option value="7">Video 4K</option>
            <option value="1">Video calls</option>
            <option value="0.1">Online gaming</option>
          </select>
        </Field>
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
    [b, setB] = useState("2026-12-07"),
    [mode, setMode] = useState<"difference" | "add">("difference"),
    [amount, setAmount] = useState(90),
    [unit, setUnit] = useState<"days" | "weeks" | "months" | "years">("days");
  const from = new Date(`${a}T00:00Z`),
    to = new Date(`${b}T00:00Z`);
  const diff = dateDifference(from, to),
    added = addCalendar(from, amount, unit);
  return (
    <Card>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Mode">
          <select
            className={input}
            value={mode}
            onChange={(e) => setMode(e.target.value as typeof mode)}
          >
            <option value="difference">Difference between dates</option>
            <option value="add">Add or subtract time</option>
          </select>
        </Field>
        <Field label="Start date">
          <input
            className={input}
            type="date"
            value={a}
            onChange={(e) => setA(e.target.value)}
          />
        </Field>
        {mode === "difference" ? (
          <Field label="End date">
            <input
              className={input}
              type="date"
              value={b}
              onChange={(e) => setB(e.target.value)}
            />
          </Field>
        ) : (
          <>
            <Field label="Amount (negative subtracts)">
              <input
                className={input}
                type="number"
                value={amount}
                onChange={(e) => setAmount(+e.target.value)}
              />
            </Field>
            <Field label="Unit">
              <select
                className={input}
                value={unit}
                onChange={(e) => setUnit(e.target.value as typeof unit)}
              >
                {["days", "weeks", "months", "years"].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </Field>
          </>
        )}
      </div>
      <p className="result-card mt-5 text-xl font-bold">
        {c.result}:{" "}
        {mode === "difference"
          ? `${diff.years * diff.sign} years, ${diff.months} months, ${diff.days} days (${fmt(diff.totalDays * diff.sign, locale ?? "en")} total days)`
          : new Intl.DateTimeFormat(locale ?? "en", {
              dateStyle: "long",
              timeZone: "UTC",
            }).format(added)}
      </p>
    </Card>
  );
}
function Timezone({ c, locale }: { c: Copy; locale?: string }) {
  const zones = [
    "Africa/Tripoli",
    "America/New_York",
    "Europe/London",
    "Asia/Tokyo",
    "Asia/Seoul",
    "Europe/Paris",
    "Europe/Berlin",
    "Asia/Kolkata",
    "Asia/Jakarta",
  ];
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
      <div className="mt-4 flex flex-wrap gap-3">
        <select
          aria-label="Add destination timezone"
          className={input}
          defaultValue=""
          onChange={(e) => {
            if (e.target.value && !dest.includes(e.target.value))
              setDest([...dest, e.target.value]);
            e.target.value = "";
          }}
        >
          <option value="">Add destination…</option>
          {zones
            .filter((z) => z !== zone && !dest.includes(z))
            .map((z) => (
              <option key={z}>{z}</option>
            ))}
        </select>
        <button
          className="button-secondary"
          onClick={() => {
            const first = dest[0];
            setDest([zone, ...dest.slice(1)]);
            setZone(first);
          }}
        >
          Swap
        </button>
        <button
          className="button-secondary"
          onClick={() =>
            navigator.clipboard.writeText(
              out.map((x) => x.join(": ")).join("\n"),
            )
          }
        >
          {c.copy}
        </button>
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
      const path = (
        {
          down: "availability",
          chain: "certificate-chain",
          tls: "tls-versions",
          https: "https-health",
        } as Partial<Record<GrowthKind, string>>
      )[kind]!;
      const res = await fetch(`${publicApiUrl}/api/v1/network/${path}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ target }),
      });
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
