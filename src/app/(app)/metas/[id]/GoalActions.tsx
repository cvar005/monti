"use client";

import { useState, useTransition } from "react";
import { addContribution, createInvite, deleteGoal, leaveGoal, setGoalShare } from "@/app/actions";
import { MAX_GOAL_PEOPLE, money, RELATIONSHIPS, relationshipLabel } from "@/lib/monti";

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
        text: res.milestone ? `¡Hito! Llegaron al ${res.milestone}% de la meta. 🎉` : `¡Bien! ${money(value, currency)} más cerca.`,
      });
    });
  }

  function makeInvite() {
    setCopied(false);
    start(async () => {
      const res = await createInvite(goalId, relationship);
      if ("code" in res && res.code) setInvite({ url: `${window.location.origin}/unirse/${res.code}`, rel: relationship });
      else setMsg({ level: "bad", text: ("error" in res && res.error) || "No pudimos crear la invitación." });
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
        <div className="owe"><b>✓ Listo por esta semana. ¡Nos vemos el lunes!</b></div>
      ) : myWeekly > 0 ? (
        <div className="owe">
          <span className="small">{shared ? "Tu parte esta semana" : "Esta semana, aparta"}</span>
          <span className="num lg">{money(myWeekly, currency)}</span>
          <span className="small">Tú mueves el dinero a tu ahorro. Monti nunca toca tu cuenta.</span>
          <button className="btn mint" type="button" disabled={pending} onClick={() => contribute(Math.round(myWeekly * 100) / 100)}>Ya lo aparté</button>
        </div>
      ) : null}

      <div className="card">
        <b>Agregar dinero</b>
        <div className="two">
          <input aria-label={`Monto en ${sym}`} className="inp" type="number" inputMode="decimal" min="0" step="0.01" placeholder={`${sym}100`} value={amount} onChange={(e) => setAmount(e.target.value)} />
          <button className="btn" type="button" disabled={pending || !(Number(amount) > 0)} onClick={() => contribute(Number(amount))}>Agregar</button>
        </div>
      </div>

      {canInvite && (
        <div className="card">
          <b>{shared ? "Invitar a alguien más" : "Ahorren esta meta juntos"}</b>
          <p className="small">
            Invita a tu pareja, tus hijos, tus papás o amigos. Entran gratis solo a esta meta y sus aportes suman. Pueden ser hasta {MAX_GOAL_PEOPLE} personas.
          </p>
          <div className="field">
            <label htmlFor="rel">¿Quién es?</label>
            <select id="rel" className="inp" value={relationship} onChange={(e) => { setRelationship(e.target.value); setInvite(null); }}>
              {RELATIONSHIPS.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
            </select>
          </div>
          {invite ? (
            <>
              <input aria-label="Link de invitación" className="inp" readOnly value={invite.url} onFocus={(e) => e.currentTarget.select()} />
              <div className="two">
                <button className="btn alt" type="button" onClick={copy}>{copied ? "Copiado ✓" : "Copiar link"}</button>
                <a className="btn" href={`https://wa.me/?text=${encodeURIComponent(`Te invito a ahorrar conmigo para "${goalName}" en Monti: ${invite.url}`)}`} target="_blank" rel="noopener noreferrer">
                  Mandar por WhatsApp
                </a>
              </div>
              <p className="small">El link sirve una sola vez, para tu {relationshipLabel(invite.rel).toLowerCase()}.</p>
            </>
          ) : (
            <button className="btn alt" type="button" disabled={pending} onClick={makeInvite}>Crear invitación</button>
          )}
        </div>
      )}

      {shared && isOwner && (
        <div className="card">
          <div className="row">
            <span className="small">Tu parte de cada semana</span>
            <span className="step">
              <button type="button" aria-label="Menos para mí" disabled={pending || ownerShare <= 10} onClick={() => start(() => setGoalShare(goalId, ownerShare - 10))}>−</button>
              <b style={{ minWidth: 52 }}>{ownerShare}%</b>
              <button type="button" aria-label="Más para mí" disabled={pending || ownerShare >= 90} onClick={() => start(() => setGoalShare(goalId, ownerShare + 10))}>+</button>
            </span>
          </div>
          <span className="small">El resto se reparte igual entre los demás.</span>
        </div>
      )}

      {isOwner ? (
        <button className="btn danger" type="button" disabled={pending} onClick={() => (confirm ? start(() => deleteGoal(goalId)) : setConfirm(true))}>
          {confirm ? "Toca otra vez para borrar la meta" : "Borrar meta"}
        </button>
      ) : (
        <button className="btn danger" type="button" disabled={pending} onClick={() => (confirm ? start(() => leaveGoal(goalId)) : setConfirm(true))}>
          {confirm ? "Toca otra vez para salir de la meta" : "Salir de esta meta"}
        </button>
      )}
    </>
  );
}
