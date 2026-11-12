import { acceptInvite } from "@/app/actions";
import { requireProfile } from "@/lib/data";
import { Logo } from "@/components/Icons";

export default async function JoinPage({ params, searchParams }: PageProps<"/unirse/[code]">) {
  const { code } = await params;
  const { error } = await searchParams;
  const { profile } = await requireProfile(true);
  const isNew = !profile.onboarded;

  return (
    <main className="center-page welcome" style={{ justifyContent: "space-between" }}>
      <div style={{ display: "grid", gap: 20, paddingTop: 30 }}>
        <Logo size={60} color="#fff" />
        <h1>Te invitaron a ahorrar juntos</h1>
        <p>Únete a la meta: los aportes de todos suman para el mismo sueño.</p>
        {isNew && <p>Es gratis: solo verás esta meta y podrás aportar. Si después quieres usar todo Monti, lo activas cuando quieras.</p>}
      </div>
      <form action={acceptInvite.bind(null, code)} className="card" style={{ color: "var(--ink)" }}>
        {isNew && (
          <div className="field">
            <label htmlFor="name">Tu nombre</label>
            <input id="name" name="name" className="inp" required autoComplete="given-name" placeholder="Carlos" />
          </div>
        )}
        {error === "full" && <div className="notice warn">Esta meta ya tiene 5 personas, el máximo.</div>}
        {error === "used" && <div className="notice warn">Esta invitación ya se usó o no existe. Pide un link nuevo.</div>}
        <button className="btn" type="submit">Unirme a la meta</button>
      </form>
    </main>
  );
}
