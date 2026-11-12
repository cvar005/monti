"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { completeOnboarding } from "@/app/actions";
import { CATEGORIES, GOAL_THEMES, TEMPLATES, money, todayISO, weeksUntil, type Split } from "@/lib/monti";
import { IconBack, Logo } from "@/components/Icons";

export default function OnboardingFlow({ initialName }: { initialName: string }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [name, setName] = useState(initialName);
  const [currency, setCurrency] = useState<"GTQ" | "USD">("GTQ");
  const [income, setIncome] = useState("");
  const [tpl, setTpl] = useState("bal");
  const [split, setSplit] = useState<Split>({ ...TEMPLATES.bal.split });
  const [goal, setGoal] = useState({ name: "", target: "", month: "", theme: "beach" });
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  const inc = Number(income);
  const total = CATEGORIES.reduce((s, c) => s + split[c.id], 0);
  const goalTarget = Number(goal.target);
  const goalDeadline = /^\d{4}-\d{2}$/.test(goal.month) ? `${goal.month}-01` : "";
  const goalValid = goal.name.trim() && goalTarget > 0 && goalDeadline > todayISO();
  const weekly = goalValid ? goalTarget / weeksUntil(goalDeadline) : 0;

  function finish(withGoal: boolean) {
    setError("");
    start(async () => {
      const res = await completeOnboarding({
        name,
        currency,
        income: inc,
        split,
        goal: withGoal && goalValid ? { name: goal.name, target: goalTarget, deadline: goalDeadline, theme: goal.theme } : null,
      });
      if (res?.error) setError(res.error);
      else router.replace("/");
    });
  }

  if (step === 0) {
    return (
      <main className="center-page welcome" style={{ justifyContent: "space-between" }}>
        <div style={{ display: "grid", gap: 20, paddingTop: 30 }}>
          <Logo size={60} color="#fff" />
          <h1>Bienvenido a Monti</h1>
          <p>En 1 minuto armamos tu presupuesto y tu primera meta.</p>
        </div>
        <button className="btn mint" type="button" onClick={() => setStep(1)}>Empezar</button>
      </main>
    );
  }

  const dots = (
    <div className="dots" aria-label={`Paso ${step} de 4`}>
      {[1, 2, 3, 4].map((i) => <i key={i} className={i <= step ? "on" : ""} />)}
    </div>
  );

  return (
    <main className="center-page">
      <div className="hdr">
        <button className="ibtn" type="button" aria-label="Atrás" onClick={() => setStep(step - 1)}><IconBack /></button>
        <div style={{ flex: 1, paddingLeft: 8 }}>{dots}</div>
      </div>

      {step === 1 && (
        <section style={{ display: "grid", gap: 16 }}>
          <h1 style={{ fontSize: 32 }}>Conozcámonos</h1>
          <div className="field">
            <label htmlFor="name">Tu nombre</label>
            <input id="name" className="inp" value={name} onChange={(e) => setName(e.target.value)} autoComplete="given-name" />
          </div>
          <div className="field">
            <span>Moneda</span>
            <div className="seg" role="group">
              <button type="button" aria-pressed={currency === "GTQ"} onClick={() => setCurrency("GTQ")}>Quetzales (Q)</button>
              <button type="button" aria-pressed={currency === "USD"} onClick={() => setCurrency("USD")}>Dólares ($)</button>
            </div>
          </div>
          <div className="field">
            <label htmlFor="income">Ingreso mensual ({currency === "USD" ? "$" : "Q"})</label>
            <input id="income" className="inp big" type="number" inputMode="decimal" min="0" value={income} onChange={(e) => setIncome(e.target.value)} placeholder="8000" />
          </div>
          <p className="small">Solo tú ves esta información.</p>
          <button className="btn" type="button" disabled={!name.trim() || !(inc > 0)} onClick={() => setStep(2)}>Siguiente</button>
        </section>
      )}

      {step === 2 && (
        <section style={{ display: "grid", gap: 14 }}>
          <h1 style={{ fontSize: 32 }}>¿Cómo lo quieres repartir?</h1>
          <p className="small">Elige un punto de partida. Puedes ajustar cada categoría.</p>
          {Object.entries(TEMPLATES).map(([id, t]) => (
            <button key={id} type="button" className="opt" aria-pressed={tpl === id} onClick={() => { setTpl(id); setSplit({ ...t.split }); }}>
              <b>{t.label}</b>
              <span>{t.hint}</span>
            </button>
          ))}
          <div className="card flat">
            {CATEGORIES.map((c) => (
              <div key={c.id} className="tx">
                <span className="l">
                  <span className="ci" style={{ background: c.bg }}>{c.icon}</span>
                  <div><b>{c.label}</b><span className="small">{money((inc * split[c.id]) / 100, currency, 0)}</span></div>
                </span>
                <span className="step">
                  <button type="button" aria-label={`Menos ${c.label}`} onClick={() => setSplit({ ...split, [c.id]: Math.max(0, split[c.id] - 5) })}>−</button>
                  <b>{split[c.id]}%</b>
                  <button type="button" aria-label={`Más ${c.label}`} onClick={() => setSplit({ ...split, [c.id]: Math.min(100, split[c.id] + 5) })}>+</button>
                </span>
              </div>
            ))}
          </div>
          <span className={`pill ${total === 100 ? "good" : "bad"}`} style={{ justifySelf: "start" }}>Total {total}%</span>
          <button className="btn" type="button" disabled={total !== 100} onClick={() => setStep(3)}>
            {total === 100 ? "Siguiente" : "El reparto debe sumar 100%"}
          </button>
        </section>
      )}

      {step === 3 && (
        <section style={{ display: "grid", gap: 14 }}>
          <h1 style={{ fontSize: 32 }}>¿Cuál es tu primer sueño?</h1>
          <p className="small">Ponle nombre y fecha. Quien nombra su meta ahorra más.</p>
          <div className={`hero sm th-${goal.theme}`}><h3>{goal.name || "Tu meta"}</h3></div>
          <div className="field">
            <label htmlFor="gname">¿Para qué ahorras?</label>
            <input id="gname" className="inp" value={goal.name} onChange={(e) => setGoal({ ...goal, name: e.target.value })} placeholder="Viaje a Cancún" />
          </div>
          <div className="field">
            <label htmlFor="gtarget">¿Cuánto? ({currency === "USD" ? "$" : "Q"})</label>
            <input id="gtarget" className="inp big" type="number" inputMode="decimal" min="0" value={goal.target} onChange={(e) => setGoal({ ...goal, target: e.target.value })} placeholder="20000" />
          </div>
          <div className="field">
            <label htmlFor="gmonth">¿Para cuándo?</label>
            <input id="gmonth" className="inp" type="month" min={todayISO().slice(0, 7)} value={goal.month} onChange={(e) => setGoal({ ...goal, month: e.target.value })} />
          </div>
          <div className="field">
            <label htmlFor="gtheme">Imagen</label>
            <select id="gtheme" className="inp" value={goal.theme} onChange={(e) => setGoal({ ...goal, theme: e.target.value })}>
              {GOAL_THEMES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </div>
          {goalValid && (
            <div className="notice good">
              Son {money(weekly, currency, 0)} por semana durante {weeksUntil(goalDeadline)} semanas.
            </div>
          )}
          <button className="btn" type="button" disabled={!goalValid} onClick={() => setStep(4)}>Siguiente</button>
          <button className="link" type="button" style={{ justifySelf: "center" }} onClick={() => { setGoal({ ...goal, name: "" }); setStep(4); }}>
            Omitir por ahora
          </button>
        </section>
      )}

      {step === 4 && (
        <section style={{ display: "grid", gap: 14 }}>
          <h1 style={{ fontSize: 32 }}>Tu plan está listo</h1>
          <div className="card flat">
            {CATEGORIES.map((c) => (
              <div key={c.id} className="tx">
                <span className="l"><span className="ci" style={{ background: c.bg }}>{c.icon}</span><b>{c.label}</b></span>
                <b className="num">{money((inc * split[c.id]) / 100, currency, 0)}</b>
              </div>
            ))}
          </div>
          {goalValid && (
            <div className="card">
              <div className={`hero sm th-${goal.theme}`}><h3>{goal.name}</h3></div>
              <b>{money(weekly, currency, 0)} por semana durante {weeksUntil(goalDeadline)} semanas</b>
            </div>
          )}
          {error && <div className="notice bad">{error}</div>}
          <button className="btn" type="button" disabled={pending} onClick={() => finish(true)}>
            {pending ? "Guardando..." : "Empezar a subir"}
          </button>
        </section>
      )}
    </main>
  );
}
