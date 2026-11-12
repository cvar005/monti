import Link from "next/link";
import { createGoal } from "@/app/actions";
import { requireFullAccess } from "@/lib/data";
import { GOAL_THEMES, todayISO } from "@/lib/monti";
import { IconBack } from "@/components/Icons";

export default async function NewGoalPage({ searchParams }: PageProps<"/metas/nueva">) {
  const { error } = await searchParams;
  const { profile } = await requireFullAccess();
  const sym = profile.currency === "USD" ? "$" : "Q";

  return (
    <>
      <div className="hdr">
        <Link className="ibtn" href="/metas" aria-label="Atrás"><IconBack /></Link>
        <span className="title">Nueva meta</span>
        <span style={{ width: 40 }} />
      </div>
      <form action={createGoal} className="card">
        <div className="field">
          <label htmlFor="name">¿Para qué ahorras?</label>
          <input id="name" name="name" className="inp" required placeholder="Viaje a Cancún" />
        </div>
        <div className="field">
          <label htmlFor="target">¿Cuánto? ({sym})</label>
          <input id="target" name="target" className="inp big" type="number" inputMode="decimal" min="1" step="0.01" required placeholder="20000" />
        </div>
        <div className="field">
          <label htmlFor="deadline">¿Para cuándo?</label>
          <input id="deadline" name="deadline" className="inp" type="month" min={todayISO().slice(0, 7)} required />
        </div>
        <div className="field">
          <label htmlFor="theme">Imagen</label>
          <select id="theme" name="theme" className="inp" defaultValue="beach">
            {GOAL_THEMES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
        </div>
        {error && <div className="notice bad">Agrega nombre, monto y una fecha futura.</div>}
        <button className="btn" type="submit">Crear mi plan</button>
      </form>
    </>
  );
}
