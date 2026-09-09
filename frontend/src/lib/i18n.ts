import { siteUrl } from "./site";
import {
  locales,
  resolveLocalePath,
  type LocaleUrl,
  type SiteLocale,
} from "./locale-routing";
export {
  isLocale,
  localeByUrl,
  localeFromPathname,
  locales,
  resolveLocalePath,
  safeLocaleSearch,
  stripLocalePrefix,
  type LocaleUrl,
  type SiteLocale,
} from "./locale-routing";

export const shellCopy = {
  en: { language: "Language", mainNav: "Main navigation", telecom: "Telecom", network: "Network", developer: "Developer", calculators: "Calculators", plans: "Plans", errors: "Errors", search: "Search", searchLabel: "Search SignalRate", searchPlaceholder: "Search JSON, IP, telecom…", tagline: "Compare. Connect. Build.", summary: "Independent tools and source-aware reference data.", toolGroup: "Tools", telecomTools: "Telecom tools", networkTools: "Network intelligence", developerTools: "Developer tools", errorKnowledge: "Error knowledge base", directories: "Directories", mobilePlans: "Mobile plans", countries: "Countries & calling codes", mcc: "MCC/MNC directory", carriers: "Carrier directory", trust: "Trust", about: "About", methodology: "Methodology", dataPolicy: "Data policy", privacy: "Privacy", terms: "Terms", contact: "Contact", page: "Page", of: "of", records: "records", previous: "Previous", next: "Next", noResults: "No results found.", skip: "Skip to main content" },
  ja: { language: "言語", mainNav: "メインナビゲーション", telecom: "通信", network: "ネットワーク", developer: "開発", calculators: "計算ツール", plans: "プラン", errors: "エラー", search: "検索", searchLabel: "SignalRate を検索", searchPlaceholder: "JSON、IP、通信を検索…", tagline: "比較。接続。構築。", summary: "独立したツールと出典を明示した参考データ。", toolGroup: "ツール", telecomTools: "通信ツール", networkTools: "ネットワーク情報", developerTools: "開発者ツール", errorKnowledge: "エラー知識ベース", directories: "ディレクトリ", mobilePlans: "モバイルプラン", countries: "国と国番号", mcc: "MCC/MNC ディレクトリ", carriers: "通信事業者", trust: "信頼性", about: "概要", methodology: "方法論", dataPolicy: "データ方針", privacy: "プライバシー", terms: "利用規約", contact: "お問い合わせ", page: "ページ", of: "/", records: "件", previous: "前へ", next: "次へ", noResults: "結果がありません。", skip: "本文へ移動" },
  "pt-br": { language: "Idioma", mainNav: "Navegação principal", telecom: "Telecom", network: "Rede", developer: "Desenvolvimento", calculators: "Calculadoras", plans: "Planos", errors: "Erros", search: "Pesquisar", searchLabel: "Pesquisar no SignalRate", searchPlaceholder: "Pesquisar JSON, IP, telecom…", tagline: "Compare. Conecte. Crie.", summary: "Ferramentas independentes e dados de referência com fontes.", toolGroup: "Ferramentas", telecomTools: "Ferramentas de telecom", networkTools: "Inteligência de rede", developerTools: "Ferramentas para desenvolvedores", errorKnowledge: "Base de erros", directories: "Diretórios", mobilePlans: "Planos móveis", countries: "Países e códigos", mcc: "Diretório MCC/MNC", carriers: "Diretório de operadoras", trust: "Confiança", about: "Sobre", methodology: "Metodologia", dataPolicy: "Política de dados", privacy: "Privacidade", terms: "Termos", contact: "Contato", page: "Página", of: "de", records: "registros", previous: "Anterior", next: "Próxima", noResults: "Nenhum resultado encontrado.", skip: "Ir para o conteúdo" },
  de: { language: "Sprache", mainNav: "Hauptnavigation", telecom: "Telekommunikation", network: "Netzwerk", developer: "Entwicklung", calculators: "Rechner", plans: "Tarife", errors: "Fehler", search: "Suchen", searchLabel: "SignalRate durchsuchen", searchPlaceholder: "JSON, IP, Telekommunikation suchen…", tagline: "Vergleichen. Verbinden. Entwickeln.", summary: "Unabhängige Werkzeuge und quellenbasierte Referenzdaten.", toolGroup: "Werkzeuge", telecomTools: "Telekommunikationswerkzeuge", networkTools: "Netzwerkinformationen", developerTools: "Entwicklerwerkzeuge", errorKnowledge: "Fehler-Wissensdatenbank", directories: "Verzeichnisse", mobilePlans: "Mobilfunktarife", countries: "Länder und Vorwahlen", mcc: "MCC/MNC-Verzeichnis", carriers: "Anbieterverzeichnis", trust: "Vertrauen", about: "Über uns", methodology: "Methodik", dataPolicy: "Datenrichtlinie", privacy: "Datenschutz", terms: "Bedingungen", contact: "Kontakt", page: "Seite", of: "von", records: "Einträge", previous: "Zurück", next: "Weiter", noResults: "Keine Ergebnisse gefunden.", skip: "Zum Inhalt springen" },
  es: { language: "Idioma", mainNav: "Navegación principal", telecom: "Telecomunicaciones", network: "Red", developer: "Desarrollo", calculators: "Calculadoras", plans: "Planes", errors: "Errores", search: "Buscar", searchLabel: "Buscar en SignalRate", searchPlaceholder: "Buscar JSON, IP, telecom…", tagline: "Compara. Conecta. Crea.", summary: "Herramientas independientes y datos de referencia con fuentes.", toolGroup: "Herramientas", telecomTools: "Herramientas de telecom", networkTools: "Inteligencia de red", developerTools: "Herramientas para desarrolladores", errorKnowledge: "Base de errores", directories: "Directorios", mobilePlans: "Planes móviles", countries: "Países y prefijos", mcc: "Directorio MCC/MNC", carriers: "Directorio de operadores", trust: "Confianza", about: "Acerca de", methodology: "Metodología", dataPolicy: "Política de datos", privacy: "Privacidad", terms: "Términos", contact: "Contacto", page: "Página", of: "de", records: "registros", previous: "Anterior", next: "Siguiente", noResults: "No se encontraron resultados.", skip: "Ir al contenido" },
  hi: { language: "भाषा", mainNav: "मुख्य नेविगेशन", telecom: "टेलीकॉम", network: "नेटवर्क", developer: "डेवलपर", calculators: "कैलकुलेटर", plans: "प्लान", errors: "त्रुटियाँ", search: "खोजें", searchLabel: "SignalRate खोजें", searchPlaceholder: "JSON, IP, टेलीकॉम खोजें…", tagline: "तुलना करें। जुड़ें। बनाएँ।", summary: "स्वतंत्र टूल और स्रोत-सचेत संदर्भ डेटा।", toolGroup: "टूल", telecomTools: "टेलीकॉम टूल", networkTools: "नेटवर्क जानकारी", developerTools: "डेवलपर टूल", errorKnowledge: "त्रुटि ज्ञान आधार", directories: "डायरेक्टरी", mobilePlans: "मोबाइल प्लान", countries: "देश और कॉलिंग कोड", mcc: "MCC/MNC डायरेक्टरी", carriers: "कैरियर डायरेक्टरी", trust: "विश्वास", about: "परिचय", methodology: "कार्यप्रणाली", dataPolicy: "डेटा नीति", privacy: "गोपनीयता", terms: "शर्तें", contact: "संपर्क", page: "पृष्ठ", of: "में से", records: "रिकॉर्ड", previous: "पिछला", next: "अगला", noResults: "कोई परिणाम नहीं मिला।", skip: "मुख्य सामग्री पर जाएँ" },
  fr: { language: "Langue", mainNav: "Navigation principale", telecom: "Télécom", network: "Réseau", developer: "Développement", calculators: "Calculatrices", plans: "Forfaits", errors: "Erreurs", search: "Rechercher", searchLabel: "Rechercher sur SignalRate", searchPlaceholder: "Rechercher JSON, IP, télécom…", tagline: "Comparez. Connectez. Créez.", summary: "Des outils indépendants et des données de référence sourcées.", toolGroup: "Outils", telecomTools: "Outils télécom", networkTools: "Intelligence réseau", developerTools: "Outils de développement", errorKnowledge: "Base de connaissances des erreurs", directories: "Annuaires", mobilePlans: "Forfaits mobiles", countries: "Pays et indicatifs", mcc: "Annuaire MCC/MNC", carriers: "Annuaire des opérateurs", trust: "Confiance", about: "À propos", methodology: "Méthodologie", dataPolicy: "Politique des données", privacy: "Confidentialité", terms: "Conditions", contact: "Contact", page: "Page", of: "sur", records: "résultats", previous: "Précédent", next: "Suivant", noResults: "Aucun résultat trouvé.", skip: "Aller au contenu" },
  ko: { language: "언어", mainNav: "주요 탐색", telecom: "통신", network: "네트워크", developer: "개발", calculators: "계산기", plans: "요금제", errors: "오류", search: "검색", searchLabel: "SignalRate 검색", searchPlaceholder: "JSON, IP, 통신 검색…", tagline: "비교하고. 연결하고. 만드세요.", summary: "독립적인 도구와 출처 기반 참조 데이터.", toolGroup: "도구", telecomTools: "통신 도구", networkTools: "네트워크 정보", developerTools: "개발자 도구", errorKnowledge: "오류 지식 베이스", directories: "디렉터리", mobilePlans: "모바일 요금제", countries: "국가 및 국제전화 코드", mcc: "MCC/MNC 디렉터리", carriers: "통신사 디렉터리", trust: "신뢰", about: "소개", methodology: "방법론", dataPolicy: "데이터 정책", privacy: "개인정보", terms: "이용약관", contact: "문의", page: "페이지", of: "/", records: "개", previous: "이전", next: "다음", noResults: "결과가 없습니다.", skip: "본문으로 이동" },
  ar: { language: "اللغة", mainNav: "التنقل الرئيسي", telecom: "الاتصالات", network: "الشبكات", developer: "المطورون", calculators: "الحاسبات", plans: "الباقات", errors: "الأخطاء", search: "بحث", searchLabel: "البحث في SignalRate", searchPlaceholder: "ابحث عن JSON أو IP أو اتصالات…", tagline: "قارن. اتصل. ابنِ.", summary: "أدوات مستقلة وبيانات مرجعية موثقة المصادر.", toolGroup: "الأدوات", telecomTools: "أدوات الاتصالات", networkTools: "معلومات الشبكات", developerTools: "أدوات المطورين", errorKnowledge: "قاعدة معرفة الأخطاء", directories: "الأدلة", mobilePlans: "باقات الهاتف", countries: "الدول ورموز الاتصال", mcc: "دليل MCC/MNC", carriers: "دليل شركات الاتصالات", trust: "الثقة", about: "حول الموقع", methodology: "المنهجية", dataPolicy: "سياسة البيانات", privacy: "الخصوصية", terms: "الشروط", contact: "اتصل بنا", page: "الصفحة", of: "من", records: "سجلات", previous: "السابق", next: "التالي", noResults: "لم يتم العثور على نتائج.", skip: "انتقل إلى المحتوى الرئيسي" },
  id: { language: "Bahasa", mainNav: "Navigasi utama", telecom: "Telekomunikasi", network: "Jaringan", developer: "Pengembang", calculators: "Kalkulator", plans: "Paket", errors: "Galat", search: "Cari", searchLabel: "Cari SignalRate", searchPlaceholder: "Cari JSON, IP, telekomunikasi…", tagline: "Bandingkan. Hubungkan. Bangun.", summary: "Alat independen dan data referensi dengan sumber.", toolGroup: "Alat", telecomTools: "Alat telekomunikasi", networkTools: "Informasi jaringan", developerTools: "Alat pengembang", errorKnowledge: "Basis pengetahuan galat", directories: "Direktori", mobilePlans: "Paket seluler", countries: "Negara dan kode panggilan", mcc: "Direktori MCC/MNC", carriers: "Direktori operator", trust: "Kepercayaan", about: "Tentang", methodology: "Metodologi", dataPolicy: "Kebijakan data", privacy: "Privasi", terms: "Ketentuan", contact: "Kontak", page: "Halaman", of: "dari", records: "data", previous: "Sebelumnya", next: "Berikutnya", noResults: "Tidak ada hasil.", skip: "Lewati ke konten utama" },
} as const;

export function localeCopy(locale: SiteLocale) {
  if (process.env.NODE_ENV === "development" && locale !== "en") {
    const translatedKeys = new Set([...Object.keys(common[locale]), ...Object.keys(shellCopy[locale])]);
    for (const key of [...Object.keys(common.en), ...Object.keys(shellCopy.en)]) {
      if (!translatedKeys.has(key)) console.warn(`[i18n] Missing ${locale}.${key}; using English fallback.`);
    }
  }
  return { ...common.en, ...(locale === "en" ? {} : common[locale]), ...shellCopy.en, ...(locale === "en" ? {} : shellCopy[locale]) };
}

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
  return resolveLocalePath(path, locale ?? "en");
}
export function alternates(path: string): Record<string, string> {
  return {
    en: `${siteUrl}${path}`,
    ...Object.fromEntries(
      locales.map((l) => [l.tag, `${siteUrl}${localizedPath(path,l.url)}`]),
    ),
    "x-default": `${siteUrl}${path}`,
  };
}
