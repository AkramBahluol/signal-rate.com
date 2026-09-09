import Link from "next/link";
import { Footer, Header } from "@/components/site-chrome";
import { localeCopy, localizedPath, type LocaleUrl } from "@/lib/i18n";

const landingCopy: Record<LocaleUrl, { eyebrow: string; intro: string; actions: string; quality: string; privacy: string }> = {
  ja: { eyebrow: "独立した通信・技術情報", intro: "メッセージ、電話番号、ネットワーク、開発データ、技術エラーを、根拠と制限を明示して理解できます。", actions: "目的に合うツールを選択", quality: "出典、確認日、データ状態を明示します。未知の値を推測しません。", privacy: "多くの変換・計算はブラウザ内で実行され、入力は保存されません。" },
  "pt-br": { eyebrow: "Inteligência técnica e de telecom independente", intro: "Entenda mensagens, números, redes, dados de desenvolvimento e erros técnicos com fontes e limites claros.", actions: "Escolha a área de trabalho", quality: "Fontes, datas de verificação e estados dos dados permanecem visíveis; valores desconhecidos não são inventados.", privacy: "A maioria dos conversores e calculadoras funciona no navegador e não armazena suas entradas." },
  de: { eyebrow: "Unabhängige Telekommunikations- und Technikinformationen", intro: "Verstehen Sie Nachrichten, Rufnummern, Netzwerke, Entwicklungsdaten und technische Fehler mit sichtbaren Quellen und Grenzen.", actions: "Wählen Sie Ihren Arbeitsbereich", quality: "Quellen, Prüfdaten und Datenstatus bleiben sichtbar; unbekannte Werte werden nicht erfunden.", privacy: "Die meisten Konverter und Rechner laufen im Browser und speichern Ihre Eingaben nicht." },
  es: { eyebrow: "Inteligencia técnica y de telecom independiente", intro: "Comprende mensajes, números, redes, datos de desarrollo y errores técnicos con fuentes y límites visibles.", actions: "Elige un área de trabajo", quality: "Las fuentes, fechas de verificación y estados son visibles; no se inventan valores desconocidos.", privacy: "La mayoría de convertidores y calculadoras funciona en el navegador y no guarda tus entradas." },
  hi: { eyebrow: "स्वतंत्र दूरसंचार और तकनीकी जानकारी", intro: "स्रोतों और सीमाओं के साथ संदेश, फ़ोन नंबर, नेटवर्क, डेवलपर डेटा और तकनीकी त्रुटियाँ समझें।", actions: "अपना कार्य क्षेत्र चुनें", quality: "स्रोत, सत्यापन तिथियाँ और डेटा स्थिति दिखाई जाती हैं; अज्ञात मान गढ़े नहीं जाते।", privacy: "अधिकांश कन्वर्टर और कैलकुलेटर ब्राउज़र में चलते हैं और आपके इनपुट सहेजते नहीं हैं।" },
  fr: { eyebrow: "Intelligence télécom et technique indépendante", intro: "Comprenez messages, numéros, réseaux, données de développement et erreurs techniques avec des sources et des limites visibles.", actions: "Choisissez votre espace de travail", quality: "Les sources, dates de vérification et états restent visibles ; les valeurs inconnues ne sont pas inventées.", privacy: "La plupart des convertisseurs et calculatrices s’exécutent dans le navigateur sans stocker vos saisies." },
  ko: { eyebrow: "독립적인 통신 및 기술 정보", intro: "출처와 한계를 명확히 확인하며 메시지, 전화번호, 네트워크, 개발 데이터와 기술 오류를 이해하세요.", actions: "작업 영역 선택", quality: "출처, 확인 날짜와 데이터 상태를 표시하며 알 수 없는 값은 추측하지 않습니다.", privacy: "대부분의 변환기와 계산기는 브라우저에서 실행되며 입력을 저장하지 않습니다." },
  ar: { eyebrow: "معلومات اتصالات وتقنية مستقلة", intro: "افهم الرسائل وأرقام الهاتف والشبكات وبيانات التطوير والأخطاء التقنية مع إظهار المصادر والقيود بوضوح.", actions: "اختر مجال العمل", quality: "نعرض المصادر وتواريخ التحقق وحالة البيانات، ولا نخترع القيم غير المعروفة.", privacy: "تعمل معظم أدوات التحويل والحساب داخل المتصفح ولا تحفظ مدخلاتك." },
  id: { eyebrow: "Informasi telekomunikasi dan teknis independen", intro: "Pahami pesan, nomor telepon, jaringan, data pengembangan, dan galat teknis dengan sumber serta batasan yang jelas.", actions: "Pilih area kerja", quality: "Sumber, tanggal verifikasi, dan status data selalu terlihat; nilai yang tidak diketahui tidak direka.", privacy: "Sebagian besar konverter dan kalkulator berjalan di browser tanpa menyimpan input Anda." },
};

const areas = [
  ["telecomTools", "/tools"], ["networkTools", "/network"], ["developerTools", "/developer-tools"],
  ["calculators", "/calculators"], ["errorKnowledge", "/errors"], ["countries", "/countries"],
] as const;

export function LocalizedHome({ locale }: { locale: LocaleUrl }) {
  const copy=localeCopy(locale),text=landingCopy[locale];
  return <><Header/><main><section className="grid-bg border-b py-20"><div className="shell max-w-4xl text-center"><p className="text-sm font-bold uppercase tracking-[.18em] text-blue-700">{text.eyebrow}</p><h1 className="mt-5 text-5xl font-bold sm:text-7xl">{copy.tagline}</h1><p className="mx-auto mt-7 max-w-3xl text-lg leading-8 text-slate-600">{text.intro}</p><Link href={localizedPath("/tools",locale)} className="mt-8 inline-block rounded-full bg-blue-600 px-6 py-3 font-semibold text-white">{copy.telecomTools}</Link></div></section><section className="shell py-16"><h2 className="text-3xl font-bold">{text.actions}</h2><div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{areas.map(([key,path])=><Link key={path} href={localizedPath(path,locale)} className="rounded-3xl border bg-white p-7 font-bold shadow-sm hover:border-blue-300">{copy[key]}</Link>)}</div></section><section className="shell grid gap-6 pb-16 lg:grid-cols-2"><article className="rounded-3xl bg-[#10213b] p-8 text-white"><h2 className="text-2xl font-bold">{copy.dataPolicy}</h2><p className="mt-4 leading-7 text-slate-200">{text.quality}</p></article><article className="rounded-3xl border bg-white p-8"><h2 className="text-2xl font-bold">{copy.privacy}</h2><p className="mt-4 leading-7 text-slate-600">{text.privacy}</p></article></section></main><Footer/></>;
}

const hubTools: Record<string, [string,string][]> = {
  "/tools": [["SMS Character Counter","/tools/sms-character-counter"],["GSM-7 Checker","/tools/gsm7-checker"],["E.164 Formatter","/tools/e164-phone-formatter"],["MCC/MNC Lookup","/tools/mcc-mnc-lookup"]],
  "/network": [["Internet Speed Test","/network/speed-test"],["What Is My IP?","/network/what-is-my-ip"],["SSL Certificate Checker","/network/ssl-checker"],["DNS Lookup","/network/dns-lookup"]],
  "/developer-tools": [["JSON Formatter","/developer-tools/json-formatter"],["Password Generator","/developer-tools/password-generator"],["JWT Decoder","/developer-tools/jwt-decoder"],["UUID Generator","/developer-tools/uuid-generator"]],
  "/errors": [["HTTP 404","/errors/http/404"],["HTTP 500","/errors/http/500"],["PostgreSQL","/errors/postgresql"],["SMPP","/errors/smpp"]],
};

export function LocalizedHub({locale,path}:{locale:LocaleUrl;path:string}){
  const copy=localeCopy(locale),text=landingCopy[locale];
  const title=path==="/tools"?copy.telecomTools:path==="/network"?copy.networkTools:path==="/developer-tools"?copy.developerTools:copy.errorKnowledge;
  return <><Header/><main className="shell py-14"><nav className="text-sm text-slate-500"><Link href={localizedPath("/",locale)}>{copy.home}</Link> / {title}</nav><h1 className="mt-7 text-4xl font-bold">{title}</h1><p className="mt-4 max-w-3xl text-lg text-slate-600">{text.intro}</p><div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{hubTools[path].map(([name,href])=><Link key={href} href={localizedPath(href,locale)} className="rounded-2xl border bg-white p-6 font-bold hover:border-blue-300">{name}</Link>)}</div><p className="mt-10 rounded-2xl bg-blue-50 p-5 text-sm text-blue-900">{text.privacy}</p></main><Footer/></>;
}
