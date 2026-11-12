import { getMonthSummary } from "@/lib/data";
import { PaceChart } from "@/components/Charts";
import { money, VARIABLE_CATEGORIES } from "@/lib/monti";
import BudgetEditor from "./BudgetEditor";

export default async function BudgetPage() {
  const s = await getMonthSummary();
  const cur = s.profile.currency;
  const worst = s.spendCats
    .filter((c) => VARIABLE_CATEGORIES.includes(c.id))
    .map((c) => ({ ...c, over: c.projected - c.budget }))
    .sort((a, b) => b.over - a.over)[0];

  return (
    <>
      <div className="hdr"><h1>Presupuesto</h1><span className="pill n" style={{ textTransform: "capitalize" }}>{s.month.name}</span></div>
      {s.totalBudget > 0 && <PaceChart s={s} />}
      {worst && worst.over > 0 && (
        <div className="fact">
          A este ritmo, {worst.label} cierra {s.month.name} {money(worst.over, cur, 0)} arriba. Gastar {money(worst.over / s.month.daysLeft, cur)} menos al día lo arregla.
        </div>
      )}
      <BudgetEditor
        currency={cur}
        income={Number(s.profile.income)}
        split={s.profile.split}
        cats={s.cats.map((c) => ({ id: c.id, label: c.label, icon: c.icon, bg: c.bg, spent: c.spent, pct: c.pct }))}
      />
    </>
  );
}
