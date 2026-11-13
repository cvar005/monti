import Link from "next/link";
import { createGoal } from "@/app/actions";
import { requireFullAccess } from "@/lib/data";
import { GOAL_THEMES, todayISO } from "@/lib/monti";
import { IconBack } from "@/components/Icons";
import { getT } from "@/lib/lang";

export default async function NewGoalPage({ searchParams }: PageProps<"/metas/nueva">) {
  const { t } = await getT();
  const { error } = await searchParams;
  const { profile } = await requireFullAccess();
  const sym = profile.currency === "USD" ? "$" : "Q";

  return (
    <>
      <div className="hdr">
        <Link className="ibtn" href="/metas" aria-label={t("Atrás")}><IconBack /></Link>
        <span className="title">{t("Nueva meta")}</span>
        <span style={{ width: 40 }} />
      </div>
      <form action={createGoal} className="card">
        <div className="field">
          <label htmlFor="name">{t("¿Para qué ahorras?")}</label>
          <input id="name" name="name" className="inp" required placeholder={t("Viaje a Cancún")} />
        </div>
        <div className="field">
          <label htmlFor="target">{t("¿Cuánto?")} ({sym})</label>
          <input id="target" name="target" className="inp big" type="number" inputMode="decimal" min="1" step="0.01" required placeholder="20000" />
        </div>
        <div className="field">
          <label htmlFor="deadline">{t("¿Para cuándo?")}</label>
          <input id="deadline" name="deadline" className="inp" type="month" min={todayISO().slice(0, 7)} required />
        </div>
        <div className="field">
          <label htmlFor="theme">{t("Imagen")}</label>
          <select id="theme" name="theme" className="inp" defaultValue="beach">
            {GOAL_THEMES.map((th) => <option key={th.id} value={th.id}>{t(th.label)}</option>)}
          </select>
        </div>
        {error && <div className="notice bad">{t("Agrega nombre, monto y una fecha futura.")}</div>}
        <button className="btn" type="submit">{t("Crear mi plan")}</button>
      </form>
    </>
  );
}
