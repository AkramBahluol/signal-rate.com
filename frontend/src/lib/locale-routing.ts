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
export type SiteLocale = "en" | LocaleUrl;

export const localeByUrl = Object.fromEntries(
  locales.map((locale) => [locale.url, locale]),
) as Record<LocaleUrl, (typeof locales)[number]>;

export const isLocale = (value: string): value is LocaleUrl =>
  value in localeByUrl;

export function localeFromPathname(pathname: string): SiteLocale {
  const first = pathname.split("/").filter(Boolean)[0]?.toLowerCase();
  return first && isLocale(first) ? first : "en";
}

export function stripLocalePrefix(pathname: string): string {
  const normalized = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const parts = normalized.split("/").filter(Boolean);
  while (parts[0] && isLocale(parts[0].toLowerCase())) parts.shift();
  return parts.length ? `/${parts.join("/")}` : "/";
}

const safeQueryKeys = new Set(["q", "page", "sort", "category", "country", "operator"]);

export function safeLocaleSearch(search = ""): string {
  const source = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const safe = new URLSearchParams();
  source.forEach((value, key) => {
    if (safeQueryKeys.has(key) && value.length <= 200) safe.append(key, value);
  });
  const result = safe.toString();
  return result ? `?${result}` : "";
}

export function resolveLocalePath(pathname: string, selected: SiteLocale, search = ""): string {
  const base = stripLocalePrefix(pathname);
  return `${selected === "en" ? base : `/${selected}${base === "/" ? "" : base}`}${safeLocaleSearch(search)}`;
}
