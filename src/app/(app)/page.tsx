import Link from "next/link";
import { getGoalsWithProgress, getMonthSummary } from "@/lib/data";
import { PaceChart, Rings } from "@/components/Charts";
import TxRow from "@/components/TxRow";
import { money } from "@/lib/monti";
import { markAllReviewed } from "@/app/actions";

export default async function HomePage() {
  const [s, g] = await Promise.all([getMonthSummary(), getGoalsWithProgress()]);
  const cur = s.profile.currency;
  const toReview = s.transactions.filter((t) => !t.reviewed);
  const dateLabel = new Date().toLocaleDateString("es-GT", { weekday: "long", day: "numeric", month: "long", timeZone: "America/Guatemala" });

  return (
    <>
      <div className="hdr">
        <Link className="avatar" href="/ajustes" aria-label="Ajustes">{(s.profile.name || "M").charAt(0).toUpperCase()}</Link>
        <div style={{ flex: 1 }}>
          <b style={{ fontSize: 16 }}>Hola, {s.profile.name}</b>
          <div className="small" style={{ textTransform: "capitalize" }}>{dateLabel}</div>
        </div>
      </div>

      {s.totalBudget > 0 ? <PaceChart s={s} /> : (
        <div className="card"><b>Arma tu presupuesto</b><Link className="btn" href="/presupuesto">Ir a presupuesto</Link></div>
      )}

      {toReview.length > 0 && (
        <div className="card">
          <span className="label">Por revisar</span>
          <div>{toReview.map((t) => <TxRow key={t.id} t={t} currency={cur} today={s.today} />)}</div>
          <form action={markAllReviewed}><button className="btn alt" type="submit">Marcar como revisado</button></form>
        </div>
      )}

      <Rings s={s} />

      <div className="row">
        <span className="label">Tus metas</span>
        <Link className="link" href="/metas">Ver todas</Link>
      </div>
      <div className="gstrip">
        {g.goals.map((goal) => {
          const p = (goal.saved / goal.target) * 100;
          return (
            <Link key={goal.id} href={`/metas/${goal.id}`} className="gcard">
              <div className={`hero sm th-${goal.theme}`}>
                {goal.shared && <span className="avs"><span className="av">👥</span></span>}
                <h3>{goal.name}</h3>
              </div>
              <div className="body">
                <div className="row"><span className="num md">{money(goal.saved, cur, 0)}</span><span className="small">{Math.round(p)}%</span></div>
                <div className="bar"><i className="teal" style={{ width: `${Math.min(100, p)}%` }} /></div>
              </div>
            </Link>
          );
        })}
        <Link href="/metas/nueva" className="gcard" style={{ width: 120, placeItems: "center", color: "var(--teal)", fontWeight: 800, border: "2px dashed #C9D3E3", background: "transparent" }}>
          + Nueva meta
        </Link>
      </div>

      <div className="card">
        <div className="row">
          <span className="label">Recientes</span>
          <Link className="link" href="/movimientos">Ver todo</Link>
        </div>
        {s.transactions.length ? (
          <div>{s.transactions.slice(0, 5).map((t) => <TxRow key={t.id} t={t} currency={cur} today={s.today} />)}</div>
        ) : (
          <div className="empty">Aún no hay gastos este mes. <Link className="link" href="/agregar">Agrega el primero</Link></div>
        )}
      </div>
    </>
  );
}
