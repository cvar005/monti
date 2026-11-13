// Translation core, safe in server and client code. Spanish is the source language:
// t(spanishText) returns the English text from en.ts when the language is English.
import { EN } from "./en";

export type Lang = "es" | "en";
export const LANG_COOKIE = "monti_lang";
export const isLang = (v: unknown): v is Lang => v === "es" || v === "en";

export type Vars = Record<string, string | number>;

export function makeT(lang: Lang) {
  return (es: string, vars?: Vars): string => {
    const text = lang === "en" ? (EN[es] ?? es) : es;
    return vars ? text.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? "")) : text;
  };
}
export type T = ReturnType<typeof makeT>;

export const dateLocale = (lang: Lang) => (lang === "en" ? "en-US" : "es-GT");
