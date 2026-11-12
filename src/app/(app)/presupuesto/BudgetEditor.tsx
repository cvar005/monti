"use client";

import { useState, useTransition } from "react";
import { updateBudget } from "@/app/actions";
import { level, money, type Split } from "@/lib/monti";

type Cat = { id: keyof Split; label: string; icon: string; bg: string; spent: number; pct: number };

export default function BudgetEditor({ currency, income, split, cats }: { currency: string; income: number; split: Split; cats: Cat[] }) {
  const [edit, setEdit] = useState(false);
  const [inc, setInc] = useState(String(income));
  const [sp, setSp] = useState<Split>(split);
  const [msg, setMsg] = useState("");
  const [pending, start] = useTransition();
  const total = Object.values(sp).reduce((s, v) => s + v, 0);
  const incomeNum = edit ? Number(inc) || 0 : income;

  function save() {
    start(async () => {
      const res = await updateBudget({ income: Number(inc), split: sp });
      if (res.error) setMsg(res.error);
      else { setMsg("Presupuesto guardado."); setEdit(false); }
    });
  }

  return (
    <>
      <div className="card">
        <div className="row">
          <div>
            <div className="small">Ingreso mensual</div>
            {edit ? (
              <input aria-label="Ingreso mensual" className="inp big" type="number" inputMode="decimal" value={inc} onChange={(e) => setInc(e.target.value)} style={{ marginTop: 4 }} />
            ) : (
              <b className="num md">{money(income, currency, 0)}</b>
            )}
          </div>
          {!edit && <button className="link" type="button" onClick={() => { setEdit(true); setMsg(""); }}>Editar</button>}
        </div>
        {edit && <span className={`pill ${total === 100 ? "good" : "bad"}`} style={{ justifySelf: "start" }}>Total {total}%{total !== 100 ? " · debe sumar 100%" : ""}</span>}
        {msg && <div className={`notice ${msg.includes("guardado") ? "good" : "bad"}`}>{msg}</div>}
      </div>

      <div className="card flat">
        {cats.map((c) => {
          const budget = (incomeNum * sp[c.id]) / 100;
          const pct = budget ? (c.spent / budget) * 100 : 0;
          const d = budget - c.spent;
          return (
            <div key={c.id} className="catrow">
              <div className="row">
                <span style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span className="ci" style={{ background: c.bg }}>{c.icon}</span>
                  <span><b style={{ fontSize: 14 }}>{c.label}</b><span className="small" style={{ display: "block" }}>{sp[c.id]}% · {money(budget, currency, 0)}</span></span>
                </span>
                {edit ? (
                  <span className="step">
                    <button type="button" aria-label={`Menos ${c.label}`} onClick={() => setSp({ ...sp, [c.id]: Math.max(0, sp[c.id] - 5) })}>−</button>
                    <b>{sp[c.id]}%</b>
                    <button type="button" aria-label={`Más ${c.label}`} onClick={() => setSp({ ...sp, [c.id]: Math.min(100, sp[c.id] + 5) })}>+</button>
                  </span>
                ) : (
                  <span className={`pill ${level(pct)}`}>{Math.round(pct)}%</span>
                )}
              </div>
              <div className="bar"><i className={c.id === "goals" ? "teal" : level(pct)} style={{ width: `${Math.min(100, pct)}%` }} /></div>
              <div className="row small">
                <span>{money(c.spent, currency, 0)} de {money(budget, currency, 0)}</span>
                <span style={{ color: d < 0 ? "var(--bad)" : undefined }}>{d < 0 ? `${money(-d, currency, 0)} de más` : `Quedan ${money(d, currency, 0)}`}</span>
              </div>
            </div>
          );
        })}
      </div>

      {edit && (
        <div className="two">
          <button className="btn alt" type="button" onClick={() => { setEdit(false); setSp(split); setInc(String(income)); }}>Cancelar</button>
          <button className="btn" type="button" disabled={pending || total !== 100 || !(Number(inc) > 0)} onClick={save}>{pending ? "Guardando..." : "Guardar"}</button>
        </div>
      )}
    </>
  );
}
