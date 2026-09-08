import type { LocaleUrl } from "./i18n";

export type GrowthKind =
  | "hub"
  | "password"
  | "timezone"
  | "down"
  | "ping"
  | "percentage"
  | "age"
  | "date"
  | "time"
  | "loan"
  | "compound"
  | "currency"
  | "unit"
  | "data"
  | "chain"
  | "certificate"
  | "csr"
  | "tls"
  | "https";
export type GrowthTool = {
  path: string;
  kind: GrowthKind;
  group: "Utility" | "Network" | "Calculator" | "SSL/TLS";
  title: string;
  description: string;
  aliases: string[];
};
const g = (
  path: string,
  kind: GrowthKind,
  group: GrowthTool["group"],
  title: string,
  description: string,
  aliases: string[],
): GrowthTool => ({ path, kind, group, title, description, aliases });
export const growthTools: GrowthTool[] = [
  g(
    "/developer-tools/password-generator",
    "password",
    "Utility",
    "Secure Password Generator",
    "Generate cryptographically secure random passwords locally in your browser.",
    ["strong password generator", "random password"],
  ),
  g(
    "/tools/time-zone-converter",
    "timezone",
    "Utility",
    "Time Zone Converter",
    "Convert dates and times across IANA time zones with daylight-saving rules.",
    ["timezone converter", "world time"],
  ),
  g(
    "/network/is-it-down",
    "down",
    "Network",
    "Is It Down?",
    "Check whether a public website is reachable from SignalRate's check location.",
    ["website down", "site availability"],
  ),
  g(
    "/network/ping-test",
    "ping",
    "Network",
    "Ping & Latency Test",
    "Measure browser latency and jitter to Cloudflare infrastructure.",
    ["ping", "latency test", "jitter test"],
  ),
  g(
    "/calculators",
    "hub",
    "Calculator",
    "SignalRate Calculators",
    "Accurate, privacy-friendly calculators for everyday, financial and network questions.",
    ["calculator hub"],
  ),
  g(
    "/calculators/percentage-calculator",
    "percentage",
    "Calculator",
    "Percentage Calculator",
    "Calculate percentages, proportions, changes, increases and decreases.",
    ["percent calculator"],
  ),
  g(
    "/calculators/age-calculator",
    "age",
    "Calculator",
    "Exact Age Calculator",
    "Calculate calendar-aware age, totals and the next birthday.",
    ["birthday calculator"],
  ),
  g(
    "/calculators/date-calculator",
    "date",
    "Calculator",
    "Date Calculator",
    "Find exact date differences or add and subtract calendar time.",
    ["date difference", "days between dates"],
  ),
  g(
    "/calculators/time-calculator",
    "time",
    "Calculator",
    "Time Calculator",
    "Find time differences and add or subtract durations across midnight.",
    ["time duration calculator"],
  ),
  g(
    "/calculators/loan-calculator",
    "loan",
    "Calculator",
    "Loan Payment Calculator",
    "Estimate fixed-rate monthly payments, total interest and amortization.",
    ["monthly payment calculator"],
  ),
  g(
    "/calculators/compound-interest-calculator",
    "compound",
    "Calculator",
    "Compound Interest Calculator",
    "Estimate compound growth with optional recurring contributions.",
    ["investment growth calculator"],
  ),
  g(
    "/calculators/currency-converter",
    "currency",
    "Calculator",
    "Currency Converter",
    "Convert currencies using cached ECB reference exchange rates.",
    ["exchange rate"],
  ),
  g(
    "/calculators/unit-converter",
    "unit",
    "Calculator",
    "Unit Converter",
    "Convert common measurement, temperature and digital data units.",
    ["measurement converter"],
  ),
  g(
    "/calculators/data-usage-calculator",
    "data",
    "Calculator",
    "Data Usage Calculator",
    "Estimate daily, weekly and monthly Internet data use with editable assumptions.",
    ["internet data calculator"],
  ),
  g(
    "/network/certificate-chain-checker",
    "chain",
    "SSL/TLS",
    "Certificate Chain Checker",
    "Inspect the TLS certificate chain served by a public HTTPS host.",
    ["ssl chain"],
  ),
  g(
    "/network/certificate-decoder",
    "certificate",
    "SSL/TLS",
    "X.509 Certificate Decoder",
    "Decode a PEM certificate locally in your browser.",
    ["x509 decoder"],
  ),
  g(
    "/network/csr-decoder",
    "csr",
    "SSL/TLS",
    "CSR Decoder",
    "Decode a PKCS#10 certificate request locally in your browser.",
    ["certificate request decoder"],
  ),
  g(
    "/network/tls-version-checker",
    "tls",
    "SSL/TLS",
    "TLS Version Checker",
    "Test TLS 1.2 and TLS 1.3 support independently.",
    ["tls checker"],
  ),
  g(
    "/network/https-checker",
    "https",
    "SSL/TLS",
    "HTTPS Checker",
    "Check redirects, certificate validity and HSTS for a public website.",
    ["https security checker"],
  ),
];
export const localizedGrowthPaths = new Set(growthTools.map((t) => t.path));
export const growthByPath = Object.fromEntries(
  growthTools.map((t) => [t.path, t]),
) as Record<string, GrowthTool>;

const translated: Record<LocaleUrl, Record<GrowthKind, [string, string]>> = {
  ja: {
    hub: [
      "SignalRate 計算ツール",
      "日常・金融・ネットワーク向けの正確でプライバシーに配慮した計算ツール。",
    ],
    password: [
      "安全なパスワード生成",
      "ブラウザ内で暗号学的に安全なパスワードを生成します。",
    ],
    timezone: ["タイムゾーン変換", "IANA タイムゾーン間で日時を変換します。"],
    down: [
      "サイト稼働確認",
      "SignalRate の確認地点から公開サイトへの到達性を確認します。",
    ],
    ping: [
      "Ping・遅延テスト",
      "Cloudflare までのブラウザ遅延とジッターを測定します。",
    ],
    percentage: ["パーセント計算", "割合、増減率を正確に計算します。"],
    age: ["年齢計算", "暦に基づく正確な年齢を計算します。"],
    date: ["日付計算", "日付差や日付の加減算を行います。"],
    time: ["時間計算", "時刻差と時間の加減算を計算します。"],
    loan: ["ローン返済計算", "固定金利ローンの返済額と利息を試算します。"],
    compound: ["複利計算", "積立を含む複利成長を試算します。"],
    currency: ["通貨換算", "ECB 参照レートで通貨を換算します。"],
    unit: ["単位換算", "一般的な単位を正確に変換します。"],
    data: [
      "データ使用量計算",
      "インターネット通信量を透明な前提で推定します。",
    ],
    chain: [
      "証明書チェーン確認",
      "HTTPS ホストの TLS 証明書チェーンを確認します。",
    ],
    certificate: [
      "X.509 証明書デコーダー",
      "PEM 証明書をブラウザ内で解析します。",
    ],
    csr: ["CSR デコーダー", "PKCS#10 CSR をブラウザ内で解析します。"],
    tls: ["TLS バージョン確認", "TLS 1.2 と 1.3 の対応を個別に確認します。"],
    https: ["HTTPS 確認", "リダイレクト、証明書、HSTS を確認します。"],
  },
  "pt-br": {} as Record<GrowthKind, [string, string]>,
  de: {} as Record<GrowthKind, [string, string]>,
  es: {} as Record<GrowthKind, [string, string]>,
  hi: {} as Record<GrowthKind, [string, string]>,
  fr: {} as Record<GrowthKind, [string, string]>,
  ko: {} as Record<GrowthKind, [string, string]>,
  ar: {} as Record<GrowthKind, [string, string]>,
  id: {} as Record<GrowthKind, [string, string]>,
};
const localeLabels: Record<
  Exclude<LocaleUrl, "ja">,
  { prefix: string; descriptions: string }
> = {
  "pt-br": {
    prefix: "Ferramenta",
    descriptions: "Cálculo preciso e privado: ",
  },
  de: {
    prefix: "Werkzeug",
    descriptions: "Präzise und datenschutzfreundlich: ",
  },
  es: { prefix: "Herramienta", descriptions: "Cálculo preciso y privado: " },
  hi: { prefix: "टूल", descriptions: "सटीक और गोपनीय: " },
  fr: {
    prefix: "Outil",
    descriptions: "Calcul précis et respectueux de la vie privée : ",
  },
  ko: { prefix: "도구", descriptions: "정확하고 개인정보를 보호하는 도구: " },
  ar: { prefix: "أداة", descriptions: "أداة دقيقة وتحترم الخصوصية: " },
  id: {
    prefix: "Alat",
    descriptions: "Perhitungan akurat dan ramah privasi: ",
  },
};
export function localizedTool(tool: GrowthTool, locale?: LocaleUrl) {
  if (!locale) return tool;
  if (locale === "ja") {
    const [title, description] = translated.ja[tool.kind];
    return { ...tool, title, description };
  }
  const l = localeLabels[locale];
  return {
    ...tool,
    title: `${l.prefix}: ${tool.title}`,
    description: `${l.descriptions}${tool.description}`,
  };
}
