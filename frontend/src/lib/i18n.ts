import { siteUrl } from "./site";

export const locales = [
  { url: "ja", tag: "ja", name: "日本語", dir: "ltr" },
  { url: "pt-br", tag: "pt-BR", name: "Português (Brasil)", dir: "ltr" },
  { url: "de", tag: "de", name: "Deutsch", dir: "ltr" },
  { url: "es", tag: "es", name: "Español", dir: "ltr" },
  { url: "hi", tag: "hi", name: "हिन्दी", dir: "ltr" },
  { url: "fr", tag: "fr", name: "Français", dir: "ltr" },
  { url: "ko", tag: "ko", name: "한국어", dir: "ltr" },
  { url: "ar", tag: "ar", name: "العربية", dir: "rtl" },
  { url: "id", tag: "id", name: "Bahasa Indonesia", dir: "ltr" },
] as const;
export type LocaleUrl = (typeof locales)[number]["url"];
export const localeByUrl = Object.fromEntries(
  locales.map((locale) => [locale.url, locale]),
) as Record<LocaleUrl, (typeof locales)[number]>;
export const isLocale = (value: string): value is LocaleUrl =>
  value in localeByUrl;

export const common = {
  en: {
    home: "Home",
    tools: "Tools",
    calculators: "Calculators",
    start: "Start",
    calculate: "Calculate",
    copy: "Copy",
    reset: "Reset",
    result: "Result",
    privacy:
      "Inputs are processed only for this calculation and are not stored or sent to advertising or analytics.",
    about: "How it works",
    limitations: "Limitations",
    related: "Related tools",
    invalid: "Please check the entered values.",
  },
  ja: {
    home: "ホーム",
    tools: "ツール",
    calculators: "計算ツール",
    start: "開始",
    calculate: "計算",
    copy: "コピー",
    reset: "リセット",
    result: "結果",
    privacy:
      "入力内容はこの計算のためだけに処理され、保存されたり広告・分析へ送信されたりしません。",
    about: "仕組み",
    limitations: "制限事項",
    related: "関連ツール",
    invalid: "入力内容を確認してください。",
  },
  "pt-br": {
    home: "Início",
    tools: "Ferramentas",
    calculators: "Calculadoras",
    start: "Iniciar",
    calculate: "Calcular",
    copy: "Copiar",
    reset: "Limpar",
    result: "Resultado",
    privacy:
      "Os dados são usados apenas neste cálculo; não são armazenados nem enviados a anúncios ou análises.",
    about: "Como funciona",
    limitations: "Limitações",
    related: "Ferramentas relacionadas",
    invalid: "Verifique os valores informados.",
  },
  de: {
    home: "Startseite",
    tools: "Werkzeuge",
    calculators: "Rechner",
    start: "Starten",
    calculate: "Berechnen",
    copy: "Kopieren",
    reset: "Zurücksetzen",
    result: "Ergebnis",
    privacy:
      "Eingaben werden nur für diese Berechnung verarbeitet, nicht gespeichert und nicht an Werbung oder Analysen gesendet.",
    about: "Funktionsweise",
    limitations: "Einschränkungen",
    related: "Ähnliche Werkzeuge",
    invalid: "Bitte Eingaben prüfen.",
  },
  es: {
    home: "Inicio",
    tools: "Herramientas",
    calculators: "Calculadoras",
    start: "Iniciar",
    calculate: "Calcular",
    copy: "Copiar",
    reset: "Restablecer",
    result: "Resultado",
    privacy:
      "Los datos solo se procesan para este cálculo; no se guardan ni se envían a publicidad o analítica.",
    about: "Cómo funciona",
    limitations: "Limitaciones",
    related: "Herramientas relacionadas",
    invalid: "Revisa los valores introducidos.",
  },
  hi: {
    home: "होम",
    tools: "टूल",
    calculators: "कैलकुलेटर",
    start: "शुरू करें",
    calculate: "गणना करें",
    copy: "कॉपी",
    reset: "रीसेट",
    result: "परिणाम",
    privacy:
      "इनपुट केवल इस गणना के लिए संसाधित होते हैं; इन्हें सहेजा या विज्ञापन/एनालिटिक्स को नहीं भेजा जाता।",
    about: "यह कैसे काम करता है",
    limitations: "सीमाएँ",
    related: "संबंधित टूल",
    invalid: "दर्ज किए गए मान जाँचें।",
  },
  fr: {
    home: "Accueil",
    tools: "Outils",
    calculators: "Calculatrices",
    start: "Démarrer",
    calculate: "Calculer",
    copy: "Copier",
    reset: "Réinitialiser",
    result: "Résultat",
    privacy:
      "Les saisies servent uniquement à ce calcul; elles ne sont ni stockées ni transmises à la publicité ou à l’analytique.",
    about: "Fonctionnement",
    limitations: "Limites",
    related: "Outils associés",
    invalid: "Vérifiez les valeurs saisies.",
  },
  ko: {
    home: "홈",
    tools: "도구",
    calculators: "계산기",
    start: "시작",
    calculate: "계산",
    copy: "복사",
    reset: "초기화",
    result: "결과",
    privacy:
      "입력값은 이 계산에만 사용되며 저장되거나 광고·분석으로 전송되지 않습니다.",
    about: "작동 방식",
    limitations: "제한 사항",
    related: "관련 도구",
    invalid: "입력값을 확인하세요.",
  },
  ar: {
    home: "الرئيسية",
    tools: "الأدوات",
    calculators: "الحاسبات",
    start: "ابدأ",
    calculate: "احسب",
    copy: "نسخ",
    reset: "إعادة ضبط",
    result: "النتيجة",
    privacy:
      "تُعالج المدخلات لهذه العملية فقط ولا تُحفظ أو تُرسل إلى الإعلانات أو التحليلات.",
    about: "طريقة العمل",
    limitations: "القيود",
    related: "أدوات ذات صلة",
    invalid: "يرجى التحقق من القيم المدخلة.",
  },
  id: {
    home: "Beranda",
    tools: "Alat",
    calculators: "Kalkulator",
    start: "Mulai",
    calculate: "Hitung",
    copy: "Salin",
    reset: "Atur ulang",
    result: "Hasil",
    privacy:
      "Input hanya diproses untuk perhitungan ini; tidak disimpan atau dikirim ke iklan maupun analitik.",
    about: "Cara kerja",
    limitations: "Batasan",
    related: "Alat terkait",
    invalid: "Periksa nilai yang dimasukkan.",
  },
} as const;

export function localizedPath(path: string, locale?: LocaleUrl) {
  return locale ? `/${locale}${path}` : path;
}
export function alternates(path: string): Record<string, string> {
  return {
    en: `${siteUrl}${path}`,
    ...Object.fromEntries(
      locales.map((l) => [l.tag, `${siteUrl}/${l.url}${path}`]),
    ),
    "x-default": `${siteUrl}${path}`,
  };
}
