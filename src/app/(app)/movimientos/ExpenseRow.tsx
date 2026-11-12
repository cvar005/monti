"use client";

import { useState, useTransition } from "react";
import { addRule, deleteTransaction, setTransactionCategory } from "@/app/actions";
import { category, money, SPEND_CATEGORIES } from "@/lib/monti";

export default function ExpenseRow({ t, currency, hasRule }: { t: { id: string; merchant: string; amount: number; category: string; source: string }; currency: string; hasRule: boolean }) {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [note, setNote] = useState("");
  const [pending, start] = useTransition();
  const c = category(t.category);

  return (
    <div style={{ borderBottom: "1px solid var(--soft)" }}>
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
            <label htmlFor={`cat-${t.id}`}>Categoría</label>
            <select id={`cat-${t.id}`} className="inp" defaultValue={t.category} disabled={pending}
              onChange={(e) => { const v = e.target.value; start(async () => { await setTransactionCategory(t.id, v); setNote(`Movido a ${category(v).label}.`); }); }}>
              {SPEND_CATEGORIES.map((x) => <option key={x.id} value={x.id}>{x.icon} {x.label}</option>)}
            </select>
          </div>
          {!hasRule && (
            <button className="btn alt" type="button" disabled={pending}
              onClick={() => start(async () => { await addRule(t.merchant, t.category); setNote(`Listo: ${t.merchant} irá siempre a ${c.label}.`); })}>
              Siempre poner {t.merchant} en {c.label}
            </button>
          )}
          {note && <div className="notice good">{note}</div>}
          <button className="btn danger" type="button" disabled={pending}
            onClick={() => (confirm ? start(async () => { await deleteTransaction(t.id); }) : setConfirm(true))}>
            {confirm ? "Toca otra vez para borrar" : "Borrar gasto"}
          </button>
        </div>
      )}
    </div>
  );
}
