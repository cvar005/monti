import { acceptInvite } from "@/app/actions";
import { requireProfile } from "@/lib/data";
import { Logo } from "@/components/Icons";
import LangSwitch from "@/components/LangSwitch";
import { getT } from "@/lib/lang";

export default async function JoinPage({ params, searchParams }: PageProps<"/unirse/[code]">) {
  const { t } = await getT();
  const { code } = await params;
  const { error } = await searchParams;
  const { profile } = await requireProfile(true);
  const isNew = !profile.onboarded;

  return (
    <main className="center-page welcome" style={{ justifyContent: "space-between" }}>
      <div style={{ display: "grid", gap: 20, paddingTop: 30 }}>
        <div className="row"><Logo size={60} color="#fff" /><LangSwitch onDark /></div>
        <h1>{t("Te invitaron a ahorrar juntos")}</h1>
        <p>{t("Únete a la meta: los aportes de todos suman para el mismo sueño.")}</p>
        {isNew && <p>{t("Es gratis: solo verás esta meta y podrás aportar. Si después quieres usar todo Monti, lo activas cuando quieras.")}</p>}
      </div>
      <form action={acceptInvite.bind(null, code)} className="card" style={{ color: "var(--ink)" }}>
        {isNew && (
          <div className="field">
            <label htmlFor="name">{t("Tu nombre")}</label>
            <input id="name" name="name" className="inp" required autoComplete="given-name" placeholder={t("Carlos")} />
          </div>
        )}
        {error === "full" && <div className="notice warn">{t("Esta meta ya tiene 5 personas, el máximo.")}</div>}
        {error === "used" && <div className="notice warn">{t("Esta invitación ya se usó o no existe. Pide un link nuevo.")}</div>}
        <button className="btn" type="submit">{t("Unirme a la meta")}</button>
      </form>
    </main>
  );
}
