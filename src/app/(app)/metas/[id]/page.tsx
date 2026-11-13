import Link from "next/link";
import { notFound } from "next/navigation";
import { requireProfile, type Goal } from "@/lib/data";
import { MAX_GOAL_PEOPLE, money, parseISO, relationshipLabel, todayISO, weeksUntil } from "@/lib/monti";
import { IconBack } from "@/components/Icons";
import GoalActions from "./GoalActions";
import { getT } from "@/lib/lang";
import { dateLocale } from "@/lib/i18n";

function mondayISO(today: string) {
  const d = parseISO(today);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default async function GoalPage({ params, searchParams }: PageProps<"/metas/[id]">) {
  const { t, lang } = await getT();
  const { id } = await params;
  const { nueva } = await searchParams;
  const { supabase, user, profile } = await requireProfile();
  const { data: goalRow } = await supabase.from("goals").select("*").eq("id", id).maybeSingle();
  if (!goalRow) notFound();
  const goal = { ...(goalRow as Goal), target: Number(goalRow.target) };

  const [{ data: contrib }, { data: people }] = await Promise.all([
    supabase.from("contributions").select("id, user_id, amount, date").eq("goal_id", id).order("date", { ascending: false }).order("created_at", { ascending: false }),
    supabase.rpc("goal_people", { g: id }),
  ]);
  const rows = (contrib ?? []).map((c) => ({ ...c, amount: Number(c.amount) }));
  const members = (people ?? []) as { user_id: string; name: string; role: string; relationship: string | null }[];
  const names = new Map(members.map((m) => [m.user_id, m.user_id === user.id ? t("Tú") : m.name || t(relationshipLabel(m.relationship))]));
  const shared = members.length > 1;
  const isOwner = goal.owner_id === user.id;
  // The owner sets their share; everyone else splits the rest evenly
  const shareOf = (m: { role: string }) => (!shared ? 100 : m.role === "owner" ? goal.owner_share : (100 - goal.owner_share) / (members.length - 1));

  const cur = profile.currency;
  const today = todayISO();
  const saved = rows.reduce((s, r) => s + r.amount, 0);
  const pct = (saved / goal.target) * 100;
  const weeks = weeksUntil(goal.deadline, today);
  const weekly = Math.max(0, (goal.target - saved) / weeks);
  const me = members.find((m) => m.user_id === user.id);
  const myShare = me ? shareOf(me) : 100;
  const myWeekly = (weekly * myShare) / 100;
  const monday = mondayISO(today);
  const myThisWeek = rows.filter((r) => r.user_id === user.id && r.date >= monday).reduce((s, r) => s + r.amount, 0);
  const byPerson = (id: string) => rows.filter((r) => r.user_id === id).reduce((s, r) => s + r.amount, 0);
  const COLORS = ["var(--teal)", "var(--partner)", "#6C7BF2", "#F2A93B", "#E46F8E"];
  const deadlineLabel = parseISO(goal.deadline).toLocaleDateString(dateLocale(lang), { month: "long", year: "numeric" });

  return (
    <>
      <div className="hdr">
        <Link className="ibtn" href="/metas" aria-label={t("Atrás")}><IconBack /></Link>
        <span className="title">{goal.name}</span>
        <span style={{ width: 40 }} />
      </div>
      {nueva && <div className="notice good">{t("Meta creada. Tu plan está listo.")}</div>}
      <div className={`hero th-${goal.theme}`}>
        <span className="small" style={{ textTransform: "capitalize" }}>{deadlineLabel}</span>
        <h3>{goal.name}</h3>
      </div>

      <div className="card">
        <div className="row"><span className="num lg">{money(saved, cur, 0)}</span><span className="small">{t("de {amount}", { amount: money(goal.target, cur, 0) })} · {Math.round(pct)}%</span></div>
        <div className="journey" aria-label={t("{pct}% de la meta", { pct: Math.round(pct) })}>
          <span className="track" />
          <span className="fill" style={{ width: `calc(${Math.min(100, pct)}% - ${(22 * Math.min(100, pct)) / 100}px)` }} />
          {[0, 25, 50, 75, 100].map((m, i) => (
            <span key={m} className={`m${pct >= m ? " on" : ""}`}>{i === 4 ? "⛳" : ""}<em>{m}%</em></span>
          ))}
        </div>
        <div style={{ textAlign: "center", fontSize: 14 }}>
          {t("Ahorren")} <b className="num" style={{ fontSize: 20 }}>{money(weekly, cur, 0)}</b> {t("cada semana durante {weeks} semanas", { weeks })}
        </div>
      </div>

      {shared && (
        <div className="card">
          <div className="row"><b>{t("Ahorrando juntos")}</b><span className="small">{t("{n} de {max} personas", { n: members.length, max: MAX_GOAL_PEOPLE })}</span></div>
          <div className="stack">
            {members.map((m, i) => (
              <i key={m.user_id} style={{ width: `${saved ? (byPerson(m.user_id) / saved) * 100 : 100 / members.length}%`, background: COLORS[i % COLORS.length] }} />
            ))}
          </div>
          <div>
            {members.map((m, i) => (
              <div key={m.user_id} className="tx">
                <span className="l">
                  <span className="av" style={{ background: COLORS[i % COLORS.length], marginLeft: 0 }}>{(names.get(m.user_id) ?? "?").charAt(0).toUpperCase()}</span>
                  <div>
                    <b>{names.get(m.user_id)}</b>
                    <span className="small">{m.role === "owner" ? t("Creó la meta") : t(relationshipLabel(m.relationship))} · {t("aporta {pct}% cada semana", { pct: Math.round(shareOf(m)) })}</span>
                  </div>
                </span>
                <span className="amt">{money(byPerson(m.user_id), cur, 0)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <GoalActions
        goalId={goal.id}
        currency={cur}
        myWeekly={myWeekly}
        doneThisWeek={myThisWeek >= myWeekly * 0.99 && myWeekly > 0}
        shared={shared}
        isOwner={isOwner}
        ownerShare={goal.owner_share}
        peopleCount={members.length}
        goalName={goal.name}
      />

      <div className="card flat">
        <div className="label" style={{ paddingTop: 12 }}>{t("Historial")}</div>
        {rows.length === 0 && <div className="empty">{t("Aún no hay aportes.")}</div>}
        {rows.map((r) => (
          <div key={r.id} className="tx">
            <span className="l">
              <span className="ci" style={{ background: r.user_id === user.id ? "#DDEFEC" : "#FCE4D6" }}>{r.user_id === user.id ? "⛰️" : "🤝"}</span>
              <div><b>{names.get(r.user_id) ?? t("Aporte")}</b><span className="small">{parseISO(r.date).toLocaleDateString(dateLocale(lang), { day: "numeric", month: "short", year: "numeric" })}</span></div>
            </span>
            <span className="amt in">+{money(r.amount, cur)}</span>
          </div>
        ))}
      </div>
    </>
  );
}
