import Link from "next/link";
import { requireFullAccess, type Transaction } from "@/lib/data";
import { friendlyDate, money, PERIODS, periodRange, ruleCategory, SPEND_CATEGORIES, todayISO } from "@/lib/monti";
import ExpenseRow from "./ExpenseRow";
import { getT } from "@/lib/lang";

const isDate = (v: unknown): v is string => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);

export default async function ExpensesPage({ searchParams }: PageProps<"/movimientos">) {
  const { t, lang } = await getT();
  const sp = await searchParams;
  const today = todayISO();
  const filter = typeof sp.c === "string" && SPEND_CATEGORIES.some((x) => x.id === sp.c) ? sp.c : "all";
  const custom = isDate(sp.desde) || isDate(sp.hasta);
  const period = custom ? "custom" : typeof sp.p === "string" && PERIODS.some((x) => x.id === sp.p) ? sp.p : "month";
  const range = custom ? { from: isDate(sp.desde) ? sp.desde : null, to: isDate(sp.hasta) ? sp.hasta : null } : periodRange(period, today);
  const openId = typeof sp.abrir === "string" ? sp.abrir : null;

  const { supabase, profile } = await requireFullAccess();
  let query = supabase
    .from("transactions")
    .select("id, merchant, amount, category, date, source, ai_confidence, reviewed")
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(500);
  if (filter !== "all") query = query.eq("category", filter);
  if (range.from) query = query.gte("date", range.from);
  if (range.to) query = query.lte("date", range.to);
  const [{ data }, { data: rules }] = await Promise.all([query, supabase.from("rules").select("match, category")]);
  const tx = ((data ?? []) as Transaction[]).filter((t) => t.category !== "goals").map((t) => ({ ...t, amount: Number(t.amount) }));
  const total = tx.reduce((s, t) => s + t.amount, 0);

  const groups = new Map<string, typeof tx>();
  tx.forEach((t) => groups.set(t.date, [...(groups.get(t.date) ?? []), t]));

  // Links keep the other filter: category chips keep the dates, date chips keep the category.
  const dateQs = custom ? { ...(range.from ? { desde: range.from } : {}), ...(range.to ? { hasta: range.to } : {}) } : period === "month" ? {} : { p: period };
  const href = (q: Record<string, string | undefined>) => {
    const s = new URLSearchParams(Object.entries(q).filter((e): e is [string, string] => !!e[1])).toString();
    return s ? `/movimientos?${s}` : "/movimientos";
  };
  const catQs = filter === "all" ? {} : { c: filter };

  return (
    <>
      <div className="hdr"><h1>{t("Gastos")}</h1></div>

      <div className="chips">
        {PERIODS.map((x) => (
          <Link key={x.id} className="chip" aria-pressed={period === x.id} href={href({ ...catQs, ...(x.id === "month" ? {} : { p: x.id }) })}>{t(x.label)}</Link>
        ))}
      </div>
      <details className="range" open={custom}>
        <summary>{t("Elegir fechas")}</summary>
        <form action="/movimientos" className="two">
          {filter !== "all" && <input type="hidden" name="c" value={filter} />}
          <div className="field">
            <label htmlFor="desde">{t("Desde")}</label>
            <input id="desde" name="desde" type="date" className="inp" max={today} defaultValue={range.from ?? ""} />
          </div>
          <div className="field">
            <label htmlFor="hasta">{t("Hasta")}</label>
            <input id="hasta" name="hasta" type="date" className="inp" max={today} defaultValue={range.to ?? ""} />
          </div>
          <button className="btn alt" type="submit" style={{ gridColumn: "1 / -1" }}>{t("Ver gastos")}</button>
        </form>
      </details>

      <div className="chips">
        <Link className="chip" aria-pressed={filter === "all"} href={href(dateQs)}>{t("Todas")}</Link>
        {SPEND_CATEGORIES.map((x) => (
          <Link key={x.id} className="chip" aria-pressed={filter === x.id} href={href({ ...dateQs, c: x.id })}>{x.icon} {t(x.label)}</Link>
        ))}
      </div>

      {tx.length > 0 && (
        <div className="card" style={{ gap: 2 }}>
          <span className="small">{custom ? t("Total en esas fechas") : period === "all" ? t("Total") : t("Total {period}", { period: t(PERIODS.find((x) => x.id === period)?.label ?? "").toLowerCase() })}</span>
          <span className="num lg">{money(total, profile.currency)}</span>
          <span className="small">{tx.length === 1 ? t("1 gasto") : t("{n} gastos", { n: tx.length })}</span>
        </div>
      )}

      {tx.length === 0 && <div className="empty">{t("No hay gastos en estas fechas.")} <Link className="link" href="/agregar">{t("Agrega uno")}</Link></div>}
      {[...groups.entries()].map(([date, rows]) => (
        <div key={date} className="card flat">
          <div className="row" style={{ paddingTop: 12 }}>
            <span className="label">{friendlyDate(date, today, lang)}</span>
            <span className="small">-{money(rows.reduce((s, r) => s + r.amount, 0), profile.currency)}</span>
          </div>
          {rows.map((t) => (
            <ExpenseRow key={t.id} t={t} currency={profile.currency} today={today} defaultOpen={t.id === openId} hasRule={ruleCategory(t.merchant, rules ?? []) === t.category} />
          ))}
        </div>
      ))}
    </>
  );
}
