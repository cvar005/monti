"use client";

import { useState, useTransition } from "react";
import { addRule, deleteTransaction, updateTransaction } from "@/app/actions";
import { category, money, SPEND_CATEGORIES } from "@/lib/monti";

type Row = { id: string; merchant: string; amount: number; category: string; date: string; source: string };

export default function ExpenseRow({ t, currency, hasRule, today, defaultOpen = false }: { t: Row; currency: string; hasRule: boolean; today: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const [confirm, setConfirm] = useState(false);
  const [form, setForm] = useState({ merchant: t.merchant, amount: String(t.amount), date: t.date, category: t.category });
  const [note, setNote] = useState<{ kind: "good" | "bad"; text: string } | null>(null);
  const [pending, start] = useTransition();
  const c = category(t.category);
  const changed = form.merchant !== t.merchant || Number(form.amount) !== t.amount || form.date !== t.date || form.category !== t.category;

  function save() {
    setNote(null);
    start(async () => {
      const res = await updateTransaction(t.id, { ...form, amount: Number(form.amount) });
      setNote(res?.error ? { kind: "bad", text: res.error } : { kind: "good", text: "Gasto actualizado." });
    });
  }

  return (
    <div id={`tx-${t.id}`} style={{ borderBottom: "1px solid var(--soft)", scrollMarginTop: 16 }}>
      <button type="button" className="tx" style={{ border: 0, background: "none", cursor: "pointer", textAlign: "left" }} onClick={() => setOpen(!open)} aria-expanded={open}>
        <span className="l">
          <span className="ci" style={{ background: c.bg }}>{c.icon}</span>
          <div><b>{t.merchant}</b><span className="small">{c.label}{t.source === "scan" ? " · 📷 escaneado" : ""}</span></div>
        </span>
        <span className="amt">-{money(t.amount, currency)}</span>
      </button>
      {open && (
        <div style={{ display: "grid", gap: 10, paddingBottom: 14 }}>
          <div className="field">
            <label htmlFor={`m-${t.id}`}>Tienda</label>
            <input id={`m-${t.id}`} className="inp" value={form.merchant} onChange={(e) => setForm({ ...form, merchant: e.target.value })} />
          </div>
          <div className="two">
            <div className="field">
              <label htmlFor={`a-${t.id}`}>Monto</label>
              <input id={`a-${t.id}`} className="inp" type="number" inputMode="decimal" min="0" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            </div>
            <div className="field">
              <label htmlFor={`d-${t.id}`}>Fecha</label>
              <input id={`d-${t.id}`} className="inp" type="date" max={today} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
          </div>
          <div className="field">
            <label htmlFor={`cat-${t.id}`}>Categoría</label>
            <select id={`cat-${t.id}`} className="inp" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {SPEND_CATEGORIES.map((x) => <option key={x.id} value={x.id}>{x.icon} {x.label}</option>)}
            </select>
          </div>
          {changed && <button className="btn" type="button" disabled={pending} onClick={save}>{pending ? "Guardando…" : "Guardar cambios"}</button>}
          {!hasRule && !changed && (
            <button className="btn alt" type="button" disabled={pending}
              onClick={() => start(async () => { await addRule(t.merchant, t.category); setNote({ kind: "good", text: `Listo: ${t.merchant} irá siempre a ${c.label}.` }); })}>
              Siempre poner {t.merchant} en {c.label}
            </button>
          )}
          {note && <div className={`notice ${note.kind}`} role="status">{note.text}</div>}
          <button className="btn danger" type="button" disabled={pending}
            onClick={() => (confirm ? start(async () => { await deleteTransaction(t.id); }) : setConfirm(true))}>
            {confirm ? "Toca otra vez para borrar" : "Borrar gasto"}
          </button>
        </div>
      )}
    </div>
  );
}
