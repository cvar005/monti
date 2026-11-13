"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { completeOnboarding } from "@/app/actions";
import { CATEGORIES, GOAL_THEMES, TEMPLATES, money, todayISO, weeksUntil, type Split } from "@/lib/monti";
import { IconBack, Logo } from "@/components/Icons";
import LangSwitch from "@/components/LangSwitch";
import { useT } from "@/components/LangProvider";

export default function OnboardingFlow({ initialName }: { initialName: string }) {
  const router = useRouter();
  const t = useT();
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
          <div className="row"><Logo size={60} color="#fff" /><LangSwitch onDark /></div>
          <h1>{t("Bienvenido a Monti")}</h1>
          <p>{t("En 1 minuto armamos tu presupuesto y tu primera meta.")}</p>
        </div>
        <button className="btn mint" type="button" onClick={() => setStep(1)}>{t("Empezar")}</button>
      </main>
    );
  }

  const dots = (
    <div className="dots" aria-label={t("Paso {step} de 4", { step })}>
      {[1, 2, 3, 4].map((i) => <i key={i} className={i <= step ? "on" : ""} />)}
    </div>
  );

  return (
    <main className="center-page">
      <div className="hdr">
        <button className="ibtn" type="button" aria-label={t("Atrás")} onClick={() => setStep(step - 1)}><IconBack /></button>
        <div style={{ flex: 1, paddingLeft: 8 }}>{dots}</div>
      </div>

      {step === 1 && (
        <section style={{ display: "grid", gap: 16 }}>
          <h1 style={{ fontSize: 32 }}>{t("Conozcámonos")}</h1>
          <div className="field">
            <label htmlFor="name">{t("Tu nombre")}</label>
            <input id="name" className="inp" value={name} onChange={(e) => setName(e.target.value)} autoComplete="given-name" />
          </div>
          <div className="field">
            <span>{t("Moneda")}</span>
            <div className="seg" role="group">
              <button type="button" aria-pressed={currency === "GTQ"} onClick={() => setCurrency("GTQ")}>{t("Quetzales (Q)")}</button>
              <button type="button" aria-pressed={currency === "USD"} onClick={() => setCurrency("USD")}>{t("Dólares ($)")}</button>
            </div>
          </div>
          <div className="field">
            <label htmlFor="income">{t("Ingreso mensual")} ({currency === "USD" ? "$" : "Q"})</label>
            <input id="income" className="inp big" type="number" inputMode="decimal" min="0" value={income} onChange={(e) => setIncome(e.target.value)} placeholder="8000" />
          </div>
          <p className="small">{t("Solo tú ves esta información.")}</p>
          <button className="btn" type="button" disabled={!name.trim() || !(inc > 0)} onClick={() => setStep(2)}>{t("Siguiente")}</button>
        </section>
      )}

      {step === 2 && (
        <section style={{ display: "grid", gap: 14 }}>
          <h1 style={{ fontSize: 32 }}>{t("¿Cómo lo quieres repartir?")}</h1>
          <p className="small">{t("Elige un punto de partida. Puedes ajustar cada categoría.")}</p>
          {Object.entries(TEMPLATES).map(([id, tp]) => (
            <button key={id} type="button" className="opt" aria-pressed={tpl === id} onClick={() => { setTpl(id); setSplit({ ...tp.split }); }}>
              <b>{t(tp.label)}</b>
              <span>{t(tp.hint)}</span>
            </button>
          ))}
          <div className="card flat">
            {CATEGORIES.map((c) => (
              <div key={c.id} className="tx">
                <span className="l">
                  <span className="ci" style={{ background: c.bg }}>{c.icon}</span>
                  <div><b>{t(c.label)}</b><span className="small">{money((inc * split[c.id]) / 100, currency, 0)}</span></div>
                </span>
                <span className="step">
                  <button type="button" aria-label={t("Menos {category}", { category: t(c.label) })} onClick={() => setSplit({ ...split, [c.id]: Math.max(0, split[c.id] - 5) })}>−</button>
                  <b>{split[c.id]}%</b>
                  <button type="button" aria-label={t("Más {category}", { category: t(c.label) })} onClick={() => setSplit({ ...split, [c.id]: Math.min(100, split[c.id] + 5) })}>+</button>
                </span>
              </div>
            ))}
          </div>
          <span className={`pill ${total === 100 ? "good" : "bad"}`} style={{ justifySelf: "start" }}>{t("Total")} {total}%</span>
          <button className="btn" type="button" disabled={total !== 100} onClick={() => setStep(3)}>
            {total === 100 ? t("Siguiente") : t("El reparto debe sumar 100%")}
          </button>
        </section>
      )}

      {step === 3 && (
        <section style={{ display: "grid", gap: 14 }}>
          <h1 style={{ fontSize: 32 }}>{t("¿Cuál es tu primer sueño?")}</h1>
          <p className="small">{t("Ponle nombre y fecha. Quien nombra su meta ahorra más.")}</p>
          <div className={`hero sm th-${goal.theme}`}><h3>{goal.name || t("Tu meta")}</h3></div>
          <div className="field">
            <label htmlFor="gname">{t("¿Para qué ahorras?")}</label>
            <input id="gname" className="inp" value={goal.name} onChange={(e) => setGoal({ ...goal, name: e.target.value })} placeholder={t("Viaje a Cancún")} />
          </div>
          <div className="field">
            <label htmlFor="gtarget">{t("¿Cuánto?")} ({currency === "USD" ? "$" : "Q"})</label>
            <input id="gtarget" className="inp big" type="number" inputMode="decimal" min="0" value={goal.target} onChange={(e) => setGoal({ ...goal, target: e.target.value })} placeholder="20000" />
          </div>
          <div className="field">
            <label htmlFor="gmonth">{t("¿Para cuándo?")}</label>
            <input id="gmonth" className="inp" type="month" min={todayISO().slice(0, 7)} value={goal.month} onChange={(e) => setGoal({ ...goal, month: e.target.value })} />
          </div>
          <div className="field">
            <label htmlFor="gtheme">{t("Imagen")}</label>
            <select id="gtheme" className="inp" value={goal.theme} onChange={(e) => setGoal({ ...goal, theme: e.target.value })}>
              {GOAL_THEMES.map((th) => <option key={th.id} value={th.id}>{t(th.label)}</option>)}
            </select>
          </div>
          {goalValid && (
            <div className="notice good">
              {t("Son {amount} por semana durante {weeks} semanas.", { amount: money(weekly, currency, 0), weeks: weeksUntil(goalDeadline) })}
            </div>
          )}
          <button className="btn" type="button" disabled={!goalValid} onClick={() => setStep(4)}>{t("Siguiente")}</button>
          <button className="link" type="button" style={{ justifySelf: "center" }} onClick={() => { setGoal({ ...goal, name: "" }); setStep(4); }}>
            {t("Omitir por ahora")}
          </button>
        </section>
      )}

      {step === 4 && (
        <section style={{ display: "grid", gap: 14 }}>
          <h1 style={{ fontSize: 32 }}>{t("Tu plan está listo")}</h1>
          <div className="card flat">
            {CATEGORIES.map((c) => (
              <div key={c.id} className="tx">
                <span className="l"><span className="ci" style={{ background: c.bg }}>{c.icon}</span><b>{t(c.label)}</b></span>
                <b className="num">{money((inc * split[c.id]) / 100, currency, 0)}</b>
              </div>
            ))}
          </div>
          {goalValid && (
            <div className="card">
              <div className={`hero sm th-${goal.theme}`}><h3>{goal.name}</h3></div>
              <b>{t("{amount} por semana durante {weeks} semanas", { amount: money(weekly, currency, 0), weeks: weeksUntil(goalDeadline) })}</b>
            </div>
          )}
          {error && <div className="notice bad">{error}</div>}
          <button className="btn" type="button" disabled={pending} onClick={() => finish(true)}>
            {pending ? t("Guardando...") : t("Empezar a subir")}
          </button>
        </section>
      )}
    </main>
  );
}
