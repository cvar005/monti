"use client";

import { useState, useTransition } from "react";
import { addContribution, createInvite, deleteGoal, leaveGoal, setGoalShare } from "@/app/actions";
import { MAX_GOAL_PEOPLE, money, RELATIONSHIPS, relationshipLabel } from "@/lib/monti";
import { useT } from "@/components/LangProvider";

export default function GoalActions(props: {
  goalId: string;
  goalName: string;
  currency: string;
  myWeekly: number;
  doneThisWeek: boolean;
  shared: boolean;
  isOwner: boolean;
  ownerShare: number;
  peopleCount: number;
}) {
  const { goalId, goalName, currency, myWeekly, doneThisWeek, shared, isOwner, ownerShare, peopleCount } = props;
  const t = useT();
  const [amount, setAmount] = useState("");
  const [msg, setMsg] = useState<{ level: string; text: string } | null>(null);
  const [relationship, setRelationship] = useState("pareja");
  const [invite, setInvite] = useState<{ url: string; rel: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [pending, start] = useTransition();
  const sym = currency === "USD" ? "$" : "Q";
  const canInvite = isOwner && peopleCount < MAX_GOAL_PEOPLE;

  function contribute(value: number) {
    start(async () => {
      const res = await addContribution(goalId, value);
      if (res.error) return setMsg({ level: "bad", text: res.error });
      setAmount("");
      setMsg({
        level: "good",
        text: res.milestone ? t("¡Hito! Llegaron al {pct}% de la meta. 🎉", { pct: res.milestone }) : t("¡Bien! {amount} más cerca.", { amount: money(value, currency) }),
      });
    });
  }

  function makeInvite() {
    setCopied(false);
    start(async () => {
      const res = await createInvite(goalId, relationship);
      if ("code" in res && res.code) setInvite({ url: `${window.location.origin}/unirse/${res.code}`, rel: relationship });
      else setMsg({ level: "bad", text: ("error" in res && res.error) || t("No pudimos crear la invitación.") });
    });
  }

  async function copy() {
    if (!invite) return;
    try {
      await navigator.clipboard.writeText(invite.url);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <>
      {msg && <div className={`notice ${msg.level}`} role="status">{msg.text}</div>}

      {doneThisWeek ? (
        <div className="owe"><b>✓ {t("Listo por esta semana. ¡Nos vemos el lunes!")}</b></div>
      ) : myWeekly > 0 ? (
        <div className="owe">
          <span className="small">{shared ? t("Tu parte esta semana") : t("Esta semana, aparta")}</span>
          <span className="num lg">{money(myWeekly, currency)}</span>
          <span className="small">{t("Tú mueves el dinero a tu ahorro. Monti nunca toca tu cuenta.")}</span>
          <button className="btn mint" type="button" disabled={pending} onClick={() => contribute(Math.round(myWeekly * 100) / 100)}>{t("Ya lo aparté")}</button>
        </div>
      ) : null}

      <div className="card">
        <b>{t("Agregar dinero")}</b>
        <div className="two">
          <input aria-label={t("Monto en {symbol}", { symbol: sym })} className="inp" type="number" inputMode="decimal" min="0" step="0.01" placeholder={`${sym}100`} value={amount} onChange={(e) => setAmount(e.target.value)} />
          <button className="btn" type="button" disabled={pending || !(Number(amount) > 0)} onClick={() => contribute(Number(amount))}>{t("Agregar")}</button>
        </div>
      </div>

      {canInvite && (
        <div className="card">
          <b>{shared ? t("Invitar a alguien más") : t("Ahorren esta meta juntos")}</b>
          <p className="small">
            {t("Invita a tu pareja, tus hijos, tus papás o amigos. Entran gratis solo a esta meta y sus aportes suman. Pueden ser hasta {max} personas.", { max: MAX_GOAL_PEOPLE })}
          </p>
          <div className="field">
            <label htmlFor="rel">{t("¿Quién es?")}</label>
            <select id="rel" className="inp" value={relationship} onChange={(e) => { setRelationship(e.target.value); setInvite(null); }}>
              {RELATIONSHIPS.map((r) => <option key={r.id} value={r.id}>{t(r.label)}</option>)}
            </select>
          </div>
          {invite ? (
            <>
              <input aria-label={t("Link de invitación")} className="inp" readOnly value={invite.url} onFocus={(e) => e.currentTarget.select()} />
              <div className="two">
                <button className="btn alt" type="button" onClick={copy}>{copied ? t("Copiado ✓") : t("Copiar link")}</button>
                <a className="btn" href={`https://wa.me/?text=${encodeURIComponent(t("Te invito a ahorrar conmigo para \"{goal}\" en Monti: {url}", { goal: goalName, url: invite.url }))}`} target="_blank" rel="noopener noreferrer">
                  {t("Mandar por WhatsApp")}
                </a>
              </div>
              <p className="small">{t("El link sirve una sola vez, para tu {who}.", { who: t(relationshipLabel(invite.rel)).toLowerCase() })}</p>
            </>
          ) : (
            <button className="btn alt" type="button" disabled={pending} onClick={makeInvite}>{t("Crear invitación")}</button>
          )}
        </div>
      )}

      {shared && isOwner && (
        <div className="card">
          <div className="row">
            <span className="small">{t("Tu parte de cada semana")}</span>
            <span className="step">
              <button type="button" aria-label={t("Menos para mí")} disabled={pending || ownerShare <= 10} onClick={() => start(() => setGoalShare(goalId, ownerShare - 10))}>−</button>
              <b style={{ minWidth: 52 }}>{ownerShare}%</b>
              <button type="button" aria-label={t("Más para mí")} disabled={pending || ownerShare >= 90} onClick={() => start(() => setGoalShare(goalId, ownerShare + 10))}>+</button>
            </span>
          </div>
          <span className="small">{t("El resto se reparte igual entre los demás.")}</span>
        </div>
      )}

      {isOwner ? (
        <button className="btn danger" type="button" disabled={pending} onClick={() => (confirm ? start(() => deleteGoal(goalId)) : setConfirm(true))}>
          {confirm ? t("Toca otra vez para borrar la meta") : t("Borrar meta")}
        </button>
      ) : (
        <button className="btn danger" type="button" disabled={pending} onClick={() => (confirm ? start(() => leaveGoal(goalId)) : setConfirm(true))}>
          {confirm ? t("Toca otra vez para salir de la meta") : t("Salir de esta meta")}
        </button>
      )}
    </>
  );
}
