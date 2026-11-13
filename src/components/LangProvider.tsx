"use client";

import { createContext, useContext, useMemo } from "react";
import { makeT, type Lang } from "@/lib/i18n";

const LangContext = createContext<Lang>("es");

export function LangProvider({ lang, children }: { lang: Lang; children: React.ReactNode }) {
  return <LangContext.Provider value={lang}>{children}</LangContext.Provider>;
}

export const useLang = () => useContext(LangContext);

/** Translator for client components: const t = useT(), then wrap Spanish text as t(spanish). */
export function useT() {
  const lang = useLang();
  return useMemo(() => makeT(lang), [lang]);
}
