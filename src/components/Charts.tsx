import Link from "next/link";
import { money } from "@/lib/monti";
import type { MonthSummary } from "@/lib/data";

/** Cumulative spending this month against the average-pace line (budget spread evenly over the month), with an under/over bubble on today. */
export function PaceChart({ s }: { s: MonthSummary }) {
  const B = s.totalBudget || 1;
  const cur = s.profile.currency;
  const cum = s.byDay[s.byDay.length - 1] ?? 0;
  const ideal = (B * s.month.day) / s.month.daysInMonth;
  const diff = ideal - cum;
  const under = diff >= 0;
  const W = 300, H = 120, P = 10, maxY = Math.max(B, cum) * 1.08;
  const X = (d: number) => P + ((d - 1) / Math.max(1, s.month.daysInMonth - 1)) * (W - 2 * P);
  const Y = (v: number) => H - P - (v / maxY) * (H - 2 * P);
  const line = s.byDay.map((v, i) => `${X(i + 1).toFixed(1)},${Y(v).toFixed(1)}`).join(" ");
  const ex = X(s.month.day), ey = Y(cum);
  const col = under ? "#3EE6A8" : "#FF6B6B";
  const bubble = under ? `${money(diff, cur, 0)} abajo` : `${money(-diff, cur, 0)} arriba`;

  return (
    <div className="card pace" style={{ gap: 8 }}>
      <div style={{ textAlign: "center" }}>
        <div><span className="num lg">{money(B - cum, cur, 0)}</span> <b>disponible</b></div>
        <div className="small">de {money(B, cur, 0)} presupuestado en {s.month.name}</div>
      </div>
      <div className="chart">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Vas ${bubble} del ritmo promedio`}>
          <defs>
            <linearGradient id="pl" x1="0" x2="1"><stop offset="0" stopColor="#9FE8CB" /><stop offset="1" stopColor={col} /></linearGradient>
            <linearGradient id="pa" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={col} stopOpacity=".22" /><stop offset="1" stopColor={col} stopOpacity="0" /></linearGradient>
          </defs>
          {[0.5, 1].map((f) => <line key={f} x1={P} x2={W - P} y1={Y(B * f)} y2={Y(B * f)} stroke="#E8EDF5" />)}
          <line x1={X(1)} y1={Y(0)} x2={X(s.month.daysInMonth)} y2={Y(B)} stroke="#A7B3C6" strokeWidth="1.5" strokeDasharray="3 4" />
          {s.byDay.length > 0 && <polygon points={`${X(1).toFixed(1)},${H - P} ${line} ${ex.toFixed(1)},${H - P}`} fill="url(#pa)" />}
          {s.byDay.length > 1 && <polyline points={line} fill="none" stroke="url(#pl)" strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round" />}
          <circle cx={ex} cy={ey} r="5.5" fill="#fff" stroke={col} strokeWidth="3" />
          <text x={W - P} y={Y(B) - 5} textAnchor="end" fontSize="9" fontWeight="700" fill="#5B6178">Ritmo promedio</text>
        </svg>
        <span className={`bubble${under ? "" : " over"}`} style={{ left: `${(ex / W) * 100}%`, top: `${(ey / H) * 100}%` }}>{bubble}</span>
      </div>
      <div className="row">
        <span className="small">Puedes gastar hoy <b className="num" style={{ fontSize: 16, color: "var(--ink)" }}>{money(s.safeToday, cur)}</b></span>
        <span className="small">Quedan {s.month.daysLeft} días</span>
      </div>
    </div>
  );
}

/** One ring per spending category: green, amber from 80%, red when over. */
export function Rings({ s }: { s: MonthSummary }) {
  const C = 2 * Math.PI * 27;
  return (
    <>
      <div className="row">
        <span className="label">Presupuestos</span>
        <Link className="link" href="/presupuesto">Categorías ›</Link>
      </div>
      <div className="rings">
        {s.spendCats.map((c) => {
          const d = c.budget - c.spent;
          const col = c.pct >= 100 ? "#FF6B6B" : c.pct >= 80 ? "#FFB547" : "#3EE6A8";
          return (
            <Link key={c.id} href={`/movimientos?c=${c.id}`} className={`ring${d < 0 ? " over" : ""}`}>
              <span className="dial">
                <svg viewBox="0 0 64 64" aria-hidden="true">
                  <circle cx="32" cy="32" r="27" fill="none" stroke="#E8EDF5" strokeWidth="6" />
                  <circle cx="32" cy="32" r="27" fill="none" stroke={col} strokeWidth="6" strokeLinecap="round" strokeDasharray={C.toFixed(1)} strokeDashoffset={(C * (1 - Math.min(c.pct, 100) / 100)).toFixed(1)} transform="rotate(-90 32 32)" />
                </svg>
                <span className="em">{c.icon}</span>
              </span>
              <span className="name">{c.label}</span>
              <b>{money(Math.abs(d), s.profile.currency, 0)}</b>
              <span className="small">{d < 0 ? "excedido" : "disponible"}</span>
            </Link>
          );
        })}
      </div>
    </>
  );
}
