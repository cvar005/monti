"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addTransaction } from "@/app/actions";
import { ruleCategory, SPEND_CATEGORIES } from "@/lib/monti";
import { IconScan } from "@/components/Icons";
import { useT } from "@/components/LangProvider";

type Draft = { merchant: string; amount: string; category: string; date: string };
type Reading = { confidence: number; receiptPath: string | null; originalTotal: number; originalCurrency: string };

/** Shrinks a phone photo to ~1100 px on its long edge before upload: faster, cheaper to read, same accuracy. */
async function shrink(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1100 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("resize"))), "image/jpeg", 0.85));
}

export default function AddExpense({ currency, rules, today }: { currency: string; rules: { match: string; category: string }[]; today: string }) {
  const router = useRouter();
  const t = useT();
  const [mode, setMode] = useState<"photo" | "manual">("photo");
  const [phase, setPhase] = useState<"pick" | "reading" | "review">("pick");
  const [preview, setPreview] = useState<string | null>(null);
  const [reading, setReading] = useState<Reading | null>(null);
  const [draft, setDraft] = useState<Draft>({ merchant: "", amount: "", category: "food", date: today });
  const [msg, setMsg] = useState<{ level: string; text: string } | null>(null);
  const [pending, start] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const sym = currency === "USD" ? "$" : "Q";

  async function onFile(file: File | undefined) {
    if (!file) return;
    setMsg(null);
    setPreview(URL.createObjectURL(file));
    setPhase("reading");
    try {
      const body = new FormData();
      body.append("image", await shrink(file), "receipt.jpg");
      const res = await fetch("/api/scan", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) {
        setMsg({ level: "warn", text: data.error ?? t("No pudimos leer el recibo. Llénalo a mano.") });
        setReading(null);
      } else {
        setDraft({ merchant: data.merchant, amount: String(data.amount), category: data.category, date: data.date });
        setReading({ confidence: data.confidence, receiptPath: data.receiptPath, originalTotal: data.originalTotal, originalCurrency: data.originalCurrency });
      }
    } catch {
      setMsg({ level: "warn", text: t("Sin conexión. Llénalo a mano o intenta de nuevo.") });
    }
    setPhase("review");
  }

  function save() {
    const amount = Number(draft.amount);
    start(async () => {
      const res = await addTransaction({
        merchant: draft.merchant,
        amount,
        category: draft.category,
        date: draft.date,
        source: reading ? "scan" : "manual",
        receiptPath: reading?.receiptPath ?? null,
        confidence: reading?.confidence ?? null,
      });
      if (res.error) return setMsg({ level: "bad", text: res.error });
      setMsg({ level: res.level ?? "good", text: res.message ?? t("Gasto guardado.") });
      reset();
      router.refresh();
    });
  }

  function reset() {
    setPhase("pick");
    setPreview(null);
    setReading(null);
    setDraft({ merchant: "", amount: "", category: "food", date: today });
    if (fileRef.current) fileRef.current.value = "";
  }

  const form = (
    <div className="card">
      {reading && (
        <div className="row">
          <span className="label">{t("Revisa los datos")}</span>
          <span className={`pill ${reading.confidence >= 0.9 ? "good" : "warn"}`}>{t("{pct}% seguro", { pct: Math.round(reading.confidence * 100) })}</span>
        </div>
      )}
      <div className="field">
        <label htmlFor="m">{t("Tienda")}</label>
        <input id="m" className="inp" value={draft.merchant} autoComplete="off"
          onChange={(e) => setDraft({ ...draft, merchant: e.target.value })}
          onBlur={() => { const c = ruleCategory(draft.merchant, rules); if (c) setDraft((d) => ({ ...d, category: c })); }}
          placeholder={t("Supermercado La Torre")} />
      </div>
      <div className="two">
        <div className="field">
          <label htmlFor="a">{t("Monto")} ({sym})</label>
          <input id="a" className="inp" type="number" inputMode="decimal" min="0" step="0.01" value={draft.amount} onChange={(e) => setDraft({ ...draft, amount: e.target.value })} placeholder="85.00" />
        </div>
        <div className="field">
          <label htmlFor="d">{t("Fecha")}</label>
          <input id="d" className="inp" type="date" max={today} value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} />
        </div>
      </div>
      <div className="field">
        <label htmlFor="c">{t("Categoría")}</label>
        <select id="c" className="inp" value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })}>
          {SPEND_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.icon} {t(c.label)}</option>)}
        </select>
      </div>
      {reading && reading.originalCurrency !== currency && (
        <p className="small">{t("El recibo decía {currency} {total}. Lo convertimos a {symbol} con tipo de cambio de 7.70.", { currency: reading.originalCurrency, total: reading.originalTotal, symbol: sym })}</p>
      )}
      <button className="btn" type="button" onClick={save} disabled={pending || !draft.merchant.trim() || !(Number(draft.amount) > 0)}>
        {pending ? t("Guardando...") : t("Guardar gasto")}
      </button>
    </div>
  );

  return (
    <>
      <div className="hdr"><h1>{t("Agregar gasto")}</h1></div>
      <div className="seg" role="group">
        <button type="button" aria-pressed={mode === "photo"} onClick={() => { setMode("photo"); reset(); }}>{t("Foto del recibo")}</button>
        <button type="button" aria-pressed={mode === "manual"} onClick={() => { setMode("manual"); reset(); }}>{t("A mano")}</button>
      </div>

      {msg && <div className={`notice ${msg.level}`} role="status">{msg.text}</div>}

      {mode === "photo" && phase === "pick" && (
        <label className="drop">
          <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={(e) => onFile(e.target.files?.[0])} />
          <span style={{ color: "var(--teal)", width: 40, height: 40, display: "block" }}><IconScan /></span>
          <b>{t("Toma una foto del recibo")}</b>
          <span className="small">{t("También sirve una factura FEL o una captura de tu app del banco.")}</span>
        </label>
      )}

      {mode === "photo" && phase !== "pick" && preview && (
        <div className="preview">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt={t("Foto del recibo")} />
          {phase === "reading" && <div className="beam" />}
        </div>
      )}

      {mode === "photo" && phase === "reading" && <div className="card"><b>{t("Leyendo tu recibo...")}</b><span className="small">{t("Tarda unos segundos.")}</span></div>}
      {((mode === "photo" && phase === "review") || mode === "manual") && form}
      {mode === "photo" && phase === "review" && <button className="link" type="button" onClick={reset} style={{ justifySelf: "center" }}>{t("Tomar otra foto")}</button>}
    </>
  );
}
