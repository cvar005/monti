import Link from "next/link";
import { requireFullAccess, type Transaction } from "@/lib/data";
import { friendlyDate, money, ruleCategory, SPEND_CATEGORIES, todayISO } from "@/lib/monti";
import ExpenseRow from "./ExpenseRow";

export default async function ExpensesPage({ searchParams }: PageProps<"/movimientos">) {
  const { c } = await searchParams;
  const filter = typeof c === "string" && SPEND_CATEGORIES.some((x) => x.id === c) ? c : "all";
  const { supabase, profile } = await requireFullAccess();
  let query = supabase
    .from("transactions")
    .select("id, merchant, amount, category, date, source, ai_confidence, reviewed")
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(200);
  if (filter !== "all") query = query.eq("category", filter);
  const [{ data }, { data: rules }] = await Promise.all([query, supabase.from("rules").select("match, category")]);
  const tx = ((data ?? []) as Transaction[]).map((t) => ({ ...t, amount: Number(t.amount) }));
  const today = todayISO();

  const groups = new Map<string, typeof tx>();
  tx.forEach((t) => groups.set(t.date, [...(groups.get(t.date) ?? []), t]));

  return (
    <>
      <div className="hdr"><h1>Gastos</h1></div>
      <div className="chips">
        <Link className="chip" aria-pressed={filter === "all"} href="/movimientos">Todo</Link>
        {SPEND_CATEGORIES.map((x) => (
          <Link key={x.id} className="chip" aria-pressed={filter === x.id} href={`/movimientos?c=${x.id}`}>{x.icon} {x.label}</Link>
        ))}
      </div>
      {tx.length === 0 && <div className="empty">No hay gastos aquí todavía. <Link className="link" href="/agregar">Agrega uno</Link></div>}
      {[...groups.entries()].map(([date, rows]) => (
        <div key={date} className="card flat">
          <div className="row" style={{ paddingTop: 12 }}>
            <span className="label">{friendlyDate(date, today)}</span>
            <span className="small">-{money(rows.reduce((s, r) => s + r.amount, 0), profile.currency)}</span>
          </div>
          {rows.map((t) => (
            <ExpenseRow key={t.id} t={t} currency={profile.currency} hasRule={ruleCategory(t.merchant, rules ?? []) === t.category} />
          ))}
        </div>
      ))}
    </>
  );
}
