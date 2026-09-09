"use client";
import { usePathname } from "next/navigation";
import { localeCopy, localeFromPathname } from "@/lib/i18n";

export function useLocaleCopy() {
  const locale=localeFromPathname(usePathname());
  return { locale, copy: localeCopy(locale) };
}
