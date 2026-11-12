import Link from "next/link";
import { getGoalsWithProgress } from "@/lib/data";
import { money, parseISO, weeksUntil } from "@/lib/monti";
import { IconPlus } from "@/components/Icons";
import { activateFullApp } from "@/app/actions";

export default async function GoalsPage() {
  const { profile, goals } = await getGoalsWithProgress();
  const cur = profile.currency;
  const total = goals.reduce((s, g) => s + g.saved, 0);
  const goalsBudget = (Number(profile.income) * profile.split.goals) / 100;
  const guest = profile.plan === "guest";

  return (
    <>
      <div className="hdr">
        <h1>Metas</h1>
        {!guest && <Link className="ibtn" href="/metas/nueva" aria-label="Nueva meta" style={{ background: "var(--teal)", color: "#fff" }}><IconPlus /></Link>}
      </div>
      {guest && (
        <form action={activateFullApp} className="card" style={{ background: "var(--teal)", color: "#fff" }}>
          <b style={{ fontSize: 17 }}>Estás aquí como invitado</b>
          <p style={{ fontSize: 14, opacity: 0.9 }}>Puedes ver y aportar a las metas a las que te invitaron. Con Monti completo también llevas tus gastos con foto, tu presupuesto y tus propias metas.</p>
          <button className="btn mint" type="submit">Activar Monti completo</button>
        </form>
      )}
      <div className="card"><span className="small">Ahorrado en todas tus metas</span><span className="num lg">{money(total, cur, 0)}</span></div>
      <div className="fact">
        <span className="label" style={{ color: "var(--teal-2)" }}>🔬 Harkin y otros, Psychological Bulletin, 2016</span>
        <span>Medir tu avance aumenta la probabilidad de cumplir tu meta, más aún si alguien más lo ve. Así lo encontraron 138 experimentos con ~20,000 personas.</span>
      </div>
      {goals.length === 0 && !guest && (
        <div className="empty">Todavía no tienes metas. <Link className="link" href="/metas/nueva">Crea la primera</Link></div>
      )}
      {goals.map((g) => {
        const p = (g.saved / g.target) * 100;
        const weekly = Math.max(0, (g.target - g.saved) / weeksUntil(g.deadline));
        const fits = weekly <= goalsBudget / 4.33;
        return (
          <Link key={g.id} href={`/metas/${g.id}`} className="gcard">
            <div className={`hero th-${g.theme}`}>
              {g.shared && <span className="avs"><span className="av">👥</span></span>}
              <span className="small" style={{ textTransform: "capitalize" }}>{parseISO(g.deadline).toLocaleDateString("es-GT", { month: "long", year: "numeric" })}</span>
              <h3>{g.name}</h3>
            </div>
            <div className="body">
              <div className="row">
                <span><span className="num md">{money(g.saved, cur, 0)}</span> <span className="small">de {money(g.target, cur, 0)}</span></span>
                {!guest && <span className={`pill ${fits ? "good" : "warn"}`}>{fits ? "Vas bien" : "Reto"}</span>}
              </div>
              <div className="bar"><i className="teal" style={{ width: `${Math.min(100, p)}%` }} /></div>
              <div className="row small"><span>{money(weekly, cur, 0)} por semana</span><span>Quedan {weeksUntil(g.deadline)} semanas</span></div>
            </div>
          </Link>
        );
      })}
    </>
  );
}
