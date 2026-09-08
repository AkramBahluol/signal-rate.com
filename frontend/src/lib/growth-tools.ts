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
const translatedTitles:Record<Exclude<LocaleUrl,"ja">,Record<GrowthKind,string>>={
 "pt-br":{hub:"Calculadoras SignalRate",password:"Gerador de senhas seguras",timezone:"Conversor de fuso horário",down:"Site está fora do ar?",ping:"Teste de ping e latência",percentage:"Calculadora de porcentagem",age:"Calculadora de idade exata",date:"Calculadora de datas",time:"Calculadora de tempo",loan:"Calculadora de empréstimo",compound:"Calculadora de juros compostos",currency:"Conversor de moedas",unit:"Conversor de unidades",data:"Calculadora de uso de dados",chain:"Verificador da cadeia de certificados",certificate:"Decodificador de certificado X.509",csr:"Decodificador de CSR",tls:"Verificador de versões TLS",https:"Verificador de HTTPS"},
 de:{hub:"SignalRate Rechner",password:"Sicherer Passwortgenerator",timezone:"Zeitzonen-Umrechner",down:"Ist die Website erreichbar?",ping:"Ping- und Latenztest",percentage:"Prozentrechner",age:"Exakter Altersrechner",date:"Datumsrechner",time:"Zeitrechner",loan:"Kreditrechner",compound:"Zinseszinsrechner",currency:"Währungsrechner",unit:"Einheitenumrechner",data:"Datenverbrauchsrechner",chain:"Zertifikatsketten-Prüfer",certificate:"X.509-Zertifikat-Decoder",csr:"CSR-Decoder",tls:"TLS-Versionsprüfer",https:"HTTPS-Prüfer"},
 es:{hub:"Calculadoras SignalRate",password:"Generador de contraseñas seguras",timezone:"Conversor de zonas horarias",down:"¿Está caído el sitio?",ping:"Prueba de ping y latencia",percentage:"Calculadora de porcentajes",age:"Calculadora de edad exacta",date:"Calculadora de fechas",time:"Calculadora de tiempo",loan:"Calculadora de préstamos",compound:"Calculadora de interés compuesto",currency:"Conversor de divisas",unit:"Conversor de unidades",data:"Calculadora de uso de datos",chain:"Comprobador de cadena de certificados",certificate:"Decodificador de certificado X.509",csr:"Decodificador de CSR",tls:"Comprobador de versiones TLS",https:"Comprobador HTTPS"},
 hi:{hub:"SignalRate कैलकुलेटर",password:"सुरक्षित पासवर्ड जेनरेटर",timezone:"समय क्षेत्र कन्वर्टर",down:"क्या वेबसाइट बंद है?",ping:"पिंग और लेटेंसी टेस्ट",percentage:"प्रतिशत कैलकुलेटर",age:"सटीक आयु कैलकुलेटर",date:"तारीख कैलकुलेटर",time:"समय कैलकुलेटर",loan:"ऋण कैलकुलेटर",compound:"चक्रवृद्धि ब्याज कैलकुलेटर",currency:"मुद्रा कन्वर्टर",unit:"इकाई कन्वर्टर",data:"डेटा उपयोग कैलकुलेटर",chain:"सर्टिफिकेट चेन चेकर",certificate:"X.509 सर्टिफिकेट डिकोडर",csr:"CSR डिकोडर",tls:"TLS संस्करण चेकर",https:"HTTPS चेकर"},
 fr:{hub:"Calculatrices SignalRate",password:"Générateur de mots de passe sécurisés",timezone:"Convertisseur de fuseaux horaires",down:"Le site est-il indisponible ?",ping:"Test de ping et de latence",percentage:"Calculatrice de pourcentage",age:"Calculatrice d’âge exact",date:"Calculatrice de dates",time:"Calculatrice de temps",loan:"Calculatrice de prêt",compound:"Calculatrice d’intérêts composés",currency:"Convertisseur de devises",unit:"Convertisseur d’unités",data:"Calculatrice de consommation de données",chain:"Vérificateur de chaîne de certificats",certificate:"Décodeur de certificat X.509",csr:"Décodeur de CSR",tls:"Vérificateur de versions TLS",https:"Vérificateur HTTPS"},
 ko:{hub:"SignalRate 계산기",password:"안전한 비밀번호 생성기",timezone:"시간대 변환기",down:"사이트 접속 상태 확인",ping:"핑 및 지연 시간 테스트",percentage:"백분율 계산기",age:"정확한 나이 계산기",date:"날짜 계산기",time:"시간 계산기",loan:"대출 계산기",compound:"복리 계산기",currency:"환율 계산기",unit:"단위 변환기",data:"데이터 사용량 계산기",chain:"인증서 체인 검사기",certificate:"X.509 인증서 디코더",csr:"CSR 디코더",tls:"TLS 버전 검사기",https:"HTTPS 검사기"},
 ar:{hub:"حاسبات SignalRate",password:"مولّد كلمات مرور آمنة",timezone:"محوّل المناطق الزمنية",down:"هل الموقع متوقف؟",ping:"اختبار الاستجابة وزمن الوصول",percentage:"حاسبة النسبة المئوية",age:"حاسبة العمر الدقيقة",date:"حاسبة التاريخ",time:"حاسبة الوقت",loan:"حاسبة القروض",compound:"حاسبة الفائدة المركبة",currency:"محوّل العملات",unit:"محوّل الوحدات",data:"حاسبة استهلاك البيانات",chain:"فاحص سلسلة الشهادات",certificate:"محلل شهادة X.509",csr:"محلل طلب CSR",tls:"فاحص إصدارات TLS",https:"فاحص HTTPS"},
 id:{hub:"Kalkulator SignalRate",password:"Pembuat kata sandi aman",timezone:"Konverter zona waktu",down:"Apakah situs sedang tidak aktif?",ping:"Tes ping dan latensi",percentage:"Kalkulator persentase",age:"Kalkulator usia tepat",date:"Kalkulator tanggal",time:"Kalkulator waktu",loan:"Kalkulator pinjaman",compound:"Kalkulator bunga majemuk",currency:"Konverter mata uang",unit:"Konverter satuan",data:"Kalkulator penggunaan data",chain:"Pemeriksa rantai sertifikat",certificate:"Dekoder sertifikat X.509",csr:"Dekoder CSR",tls:"Pemeriksa versi TLS",https:"Pemeriksa HTTPS"}
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
    title: translatedTitles[locale][tool.kind],
    description: `${l.descriptions}${translatedTitles[locale][tool.kind]}.`,
  };
}
