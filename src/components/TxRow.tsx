import { category, friendlyDate, money } from "@/lib/monti";

export default function TxRow({ t, currency, today }: { t: { merchant: string; amount: number; category: string; date: string; source?: string }; currency: string; today: string }) {
  const c = category(t.category);
  return (
    <div className="tx">
      <span className="l">
        <span className="ci" style={{ background: c.bg }}>{c.icon}</span>
        <div>
          <b>{t.merchant}</b>
          <span className="small">{c.label} · {friendlyDate(t.date, today)}{t.source === "scan" ? " · 📷" : ""}</span>
        </div>
      </span>
      <span className="amt">-{money(t.amount, currency)}</span>
    </div>
  );
}
