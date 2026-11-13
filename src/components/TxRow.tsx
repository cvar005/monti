import Link from "next/link";
import { category, friendlyDate, money } from "@/lib/monti";
import { makeT, type Lang } from "@/lib/i18n";

/** Expense row on Home (always this month); tapping it opens the expense in Gastos to edit or delete it. */
export default function TxRow({ t, currency, today, lang }: { t: { id: string; merchant: string; amount: number; category: string; date: string; source?: string }; currency: string; today: string; lang: Lang }) {
  const tr = makeT(lang);
  const c = category(t.category);
  return (
    <Link className="tx" href={`/movimientos?abrir=${t.id}#tx-${t.id}`}>
      <span className="l">
        <span className="ci" style={{ background: c.bg }}>{c.icon}</span>
        <div>
          <b>{t.merchant}</b>
          <span className="small">{tr(c.label)} · {friendlyDate(t.date, today, lang)}{t.source === "scan" ? " · 📷" : ""}</span>
        </div>
      </span>
      <span className="amt">-{money(t.amount, currency)}</span>
    </Link>
  );
}
