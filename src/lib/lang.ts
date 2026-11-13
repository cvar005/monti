import "server-only";
import { cookies, headers } from "next/headers";
import { isLang, LANG_COOKIE, makeT, type Lang } from "./i18n";

/** The saved language, or the browser's language the first time (Spanish unless the browser asks for English). */
export async function getLang(): Promise<Lang> {
  const saved = (await cookies()).get(LANG_COOKIE)?.value;
  if (isLang(saved)) return saved;
  const accept = (await headers()).get("accept-language") ?? "";
  return accept.toLowerCase().startsWith("en") ? "en" : "es";
}

export async function getT() {
  const lang = await getLang();
  return { lang, t: makeT(lang) };
}
