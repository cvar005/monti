"use client";

import { useState } from "react";
import { readFlag, useClientValue, writeFlag } from "@/lib/useClient";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/Icons";
import InstallGuide from "@/components/InstallGuide";

const SKIP_KEY = "monti-install-skipped";

export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "/";
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(params.get("error") ? "Ese link ya no sirve. Pide un código nuevo." : "");
  // Invited people join first; the app offers the install steps right after
  const skippedBefore = useClientValue(() => readFlag(SKIP_KEY), false);
  const [skipped, setSkipped] = useState(false);
  const showGuide = !next.startsWith("/unirse") && !skippedBefore && !skipped;

  function skipGuide() {
    setSkipped(true);
    writeFlag(SKIP_KEY);
  }

  async function sendCode(e?: React.FormEvent) {
    e?.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError("Escribe un correo válido.");
    setBusy(true);
    setError("");
    const { error: err } = await createClient().auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    setBusy(false);
    if (err) return setError(err.status === 429 ? "Espera un minuto antes de pedir otro código." : "No pudimos mandar el código. Intenta de nuevo.");
    setCode("");
    setStep("code");
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    const token = code.replace(/\D/g, "");
    if (token.length < 6) return setError("Escribe el código completo.");
    setBusy(true);
    setError("");
    const { error: err } = await createClient().auth.verifyOtp({ email: email.trim(), token, type: "email" });
    if (err) {
      setBusy(false);
      return setError("Ese código no funcionó o ya venció. Revisa el correo o pide uno nuevo.");
    }
    router.replace(next.startsWith("/") ? next : "/");
    router.refresh();
  }

  return (
    <main className="center-page welcome" style={{ justifyContent: "space-between" }}>
      <div style={{ display: "grid", gap: 18, paddingTop: 24 }}>
        <Logo size={56} color="#fff" />
        <h1>Tu dinero, un paso a la vez hacia la cima.</h1>
        <p>Lleva tus gastos, cuida tu presupuesto y cumple tus metas, solo o en pareja.</p>
      </div>

      <div style={{ display: "grid", gap: 14 }}>
        {showGuide && <InstallGuide onSkip={skipGuide} />}

        {step === "email" ? (
          <form onSubmit={sendCode} className="card" style={{ color: "var(--ink)" }}>
            <div className="field">
              <label htmlFor="email">Tu correo</label>
              <input id="email" className="inp" type="email" autoComplete="email" inputMode="email" autoCapitalize="none" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nombre@correo.com" />
            </div>
            {error && <div className="notice bad">{error}</div>}
            <button className="btn" type="submit" disabled={busy}>{busy ? "Enviando..." : "Mandarme un código"}</button>
            <p className="small">Sin contraseñas: te mandamos un código de 6 dígitos a tu correo.</p>
          </form>
        ) : (
          <form onSubmit={verify} className="card" style={{ color: "var(--ink)" }}>
            <b style={{ fontSize: 17 }}>Revisa tu correo</b>
            <p className="small">Mandamos un código a {email}. Puede tardar un minuto; revisa también spam o promociones.</p>
            <div className="field">
              <label htmlFor="code">Código</label>
              <input id="code" className="inp big" style={{ letterSpacing: "0.3em", textAlign: "center" }} inputMode="numeric" autoComplete="one-time-code" maxLength={10} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} placeholder="••••••" autoFocus />
            </div>
            {error && <div className="notice bad">{error}</div>}
            <button className="btn" type="submit" disabled={busy}>{busy ? "Entrando..." : "Entrar"}</button>
            <div className="row">
              <button className="link" type="button" onClick={() => { setStep("email"); setError(""); }}>Cambiar correo</button>
              <button className="link" type="button" onClick={() => sendCode()} disabled={busy}>Mandar otro código</button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
