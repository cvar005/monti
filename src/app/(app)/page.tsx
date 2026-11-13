import Link from "next/link";
import { getGoalsWithProgress, getMonthSummary } from "@/lib/data";
import { PaceChart, Rings } from "@/components/Charts";
import TxRow from "@/components/TxRow";
import { money } from "@/lib/monti";
import { markAllReviewed } from "@/app/actions";
import { getT } from "@/lib/lang";
import { dateLocale } from "@/lib/i18n";

export default async function HomePage() {
  const { t, lang } = await getT();
  const [s, g] = await Promise.all([getMonthSummary(), getGoalsWithProgress()]);
  const cur = s.profile.currency;
  const toReview = s.transactions.filter((t) => !t.reviewed);
  const dateLabel = new Date().toLocaleDateString(dateLocale(lang), { weekday: "long", day: "numeric", month: "long", timeZone: "America/Guatemala" });

  return (
    <>
      <div className="hdr">
        <Link className="avatar" href="/ajustes" aria-label={t("Ajustes")}>{(s.profile.name || "M").charAt(0).toUpperCase()}</Link>
        <div style={{ flex: 1 }}>
          <b style={{ fontSize: 16 }}>{t("Hola, {name}", { name: s.profile.name })}</b>
          <div className="small" style={{ textTransform: "capitalize" }}>{dateLabel}</div>
        </div>
      </div>

      {s.totalBudget > 0 ? <PaceChart s={s} lang={lang} /> : (
        <div className="card"><b>{t("Arma tu presupuesto")}</b><Link className="btn" href="/presupuesto">{t("Ir a presupuesto")}</Link></div>
      )}

      {toReview.length > 0 && (
        <div className="card">
          <span className="label">{t("Por revisar")}</span>
          <div>{toReview.map((x) => <TxRow key={x.id} t={x} currency={cur} today={s.today} lang={lang} />)}</div>
          <form action={markAllReviewed}><button className="btn alt" type="submit">{t("Marcar como revisado")}</button></form>
        </div>
      )}

      <Rings s={s} lang={lang} />

      <div className="row">
        <span className="label">{t("Tus metas")}</span>
        <Link className="link" href="/metas">{t("Ver todas")}</Link>
      </div>
      {g.goals.length === 0 ? (
        <div className="empty" style={{ background: "#fff", borderRadius: 20 }}>{t("Aún no tienes metas.")} <Link className="link" href="/metas/nueva">{t("Crea la primera")}</Link></div>
      ) : (
        <div className="glist">
          {g.goals.slice(0, 3).map((goal) => {
            const p = (goal.saved / goal.target) * 100;
            return (
              <Link key={goal.id} href={`/metas/${goal.id}`} className="gline">
                <span className={`hero thumb th-${goal.theme}`} aria-hidden="true" />
                <span className="info">
                  <span className="row"><b>{goal.name}{goal.shared ? " 👥" : ""}</b><span className="num" style={{ fontSize: 15 }}>{Math.round(p)}%</span></span>
                  <span className="bar"><i className="teal" style={{ width: `${Math.min(100, p)}%` }} /></span>
                  <span className="small">{t("{saved} de {target}", { saved: money(goal.saved, cur, 0), target: money(goal.target, cur, 0) })}</span>
                </span>
              </Link>
            );
          })}
        </div>
      )}

      <div className="card">
        <div className="row">
          <span className="label">{t("Recientes")}</span>
          <Link className="link" href="/movimientos">{t("Ver todo")}</Link>
        </div>
        {s.transactions.length ? (
          <div>{s.transactions.slice(0, 5).map((x) => <TxRow key={x.id} t={x} currency={cur} today={s.today} lang={lang} />)}</div>
        ) : (
          <div className="empty">{t("Aún no hay gastos este mes.")} <Link className="link" href="/agregar">{t("Agrega el primero")}</Link></div>
        )}
      </div>
    </>
  );
}
