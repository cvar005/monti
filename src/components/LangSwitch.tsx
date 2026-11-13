"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setLanguage } from "@/app/actions";
import { useLang } from "./LangProvider";
import type { Lang } from "@/lib/i18n";

/** Español / English switch. `onDark` styles it for the teal welcome screens. */
export default function LangSwitch({ onDark = false }: { onDark?: boolean }) {
  const lang = useLang();
  const router = useRouter();
  const [pending, start] = useTransition();

  function pick(next: Lang) {
    if (next === lang) return;
    start(async () => {
      await setLanguage(next);
      router.refresh();
    });
  }

  return (
    <div className={onDark ? "langsw" : "seg"} role="group" aria-label="Idioma / Language">
      <button type="button" aria-pressed={lang === "es"} disabled={pending} onClick={() => pick("es")}>Español</button>
      <button type="button" aria-pressed={lang === "en"} disabled={pending} onClick={() => pick("en")}>English</button>
    </div>
  );
}
