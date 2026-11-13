"use client";

import { useEffect, useState } from "react";
import { useClientValue } from "@/lib/useClient";
import { useT } from "./LangProvider";

type Platform = "ios" | "ios-inapp" | "android" | null;
type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

function detect(): Platform {
  const ua = navigator.userAgent;
  const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true;
  if (standalone) return null;
  const ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  if (ios) return /FBAN|FBAV|Instagram|Line\/|GSA\//.test(ua) ? "ios-inapp" : "ios";
  if (/Android/.test(ua)) return "android";
  return null;
}

const ShareIcon = ({ label }: { label: string }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-label={label} style={{ display: "inline", verticalAlign: "-3px" }}>
    <path d="M12 3v12M8 7l4-4 4 4" /><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
  </svg>
);

/**
 * Walks phone users through adding Monti to the home screen before they sign in,
 * so the session lives inside the installed app (iOS keeps the home-screen app's
 * login separate from Safari's).
 */
export default function InstallGuide({ onSkip }: { onSkip?: () => void }) {
  const t = useT();
  const platform = useClientValue<Platform>(detect, null);
  const [installEvent, setInstallEvent] = useState<InstallEvent | null>(null);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as InstallEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (!platform) return null;

  return (
    <div className="card" style={{ color: "var(--ink)" }}>
      <b style={{ fontSize: 17 }}>{t("Instala Monti en tu teléfono")}</b>
      {platform === "ios-inapp" && (
        <p style={{ fontSize: 14 }}>
          {t("Estás dentro de otra app. Toca ⋯ o el ícono de la brújula y elige Abrir en Safari. Ahí podrás instalar Monti.")}
        </p>
      )}
      {platform === "ios" && (
        <ol style={{ margin: 0, paddingLeft: 20, display: "grid", gap: 8, fontSize: 14 }}>
          <li><ShareIcon label={t("Compartir")} /> {t("Toca Compartir, abajo en Safari.")}</li>
          <li>{t("Baja y toca Agregar a pantalla de inicio.")}</li>
          <li>{t("Toca Agregar y abre Monti desde su ícono.")}</li>
        </ol>
      )}
      {platform === "android" &&
        (installEvent ? (
          <button className="btn" type="button" onClick={async () => { await installEvent.prompt(); setInstallEvent(null); }}>
            {t("Instalar Monti")}
          </button>
        ) : (
          <p style={{ fontSize: 14 }}>{t("Toca el menú ⋮ de Chrome y elige Instalar app o Agregar a la pantalla principal.")}</p>
        ))}
      <p className="small">{t("Así se abre como app, a pantalla completa, y no tienes que volver a entrar.")}</p>
      {onSkip && (
        <button className="link" type="button" onClick={onSkip} style={{ justifySelf: "start" }}>
          {t("Ya la instalé o prefiero seguir aquí")}
        </button>
      )}
    </div>
  );
}
