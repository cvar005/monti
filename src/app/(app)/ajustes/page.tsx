import Link from "next/link";
import { requireProfile } from "@/lib/data";
import { category } from "@/lib/monti";
import { activateFullApp, deleteRule, signOut, updateProfile } from "@/app/actions";
import { IconBack } from "@/components/Icons";

export default async function SettingsPage() {
  const { supabase, user, profile } = await requireProfile();
  const { data: rules } = await supabase.from("rules").select("id, match, category").order("created_at");

  return (
    <>
      <div className="hdr">
        <Link className="ibtn" href={profile.plan === "guest" ? "/metas" : "/"} aria-label="Atrás"><IconBack /></Link>
        <span className="title">Ajustes</span>
        <span style={{ width: 40 }} />
      </div>

      <div className="card" style={{ justifyItems: "center", textAlign: "center" }}>
        <span className="avatar" style={{ width: 64, height: 64, fontSize: 26 }}>{(profile.name || "M").charAt(0).toUpperCase()}</span>
        <b style={{ fontSize: 18 }}>{profile.name}</b>
        <span className="small">{user.email}</span>
        <span className="pill good">{profile.plan === "guest" ? "👥 Invitado a metas" : "⛰️ Miembro fundador"}</span>
      </div>

      {profile.plan === "guest" && (
        <form action={activateFullApp} className="card">
          <b>Usa todo Monti</b>
          <p className="small">Gastos con foto, presupuesto con alertas y tus propias metas. Tus metas compartidas se quedan igual.</p>
          <button className="btn" type="submit">Activar Monti completo</button>
        </form>
      )}

      <form action={updateProfile} className="card">
        <div className="field">
          <label htmlFor="name">Nombre</label>
          <input id="name" name="name" className="inp" defaultValue={profile.name} />
        </div>
        <div className="field">
          <label htmlFor="currency">Moneda</label>
          <select id="currency" name="currency" className="inp" defaultValue={profile.currency}>
            <option value="GTQ">Quetzales (Q)</option>
            <option value="USD">Dólares ($)</option>
          </select>
          <span className="small">Cambiar la moneda no convierte los montos que ya registraste.</span>
        </div>
        <button className="btn alt" type="submit">Guardar</button>
      </form>

      {profile.plan !== "guest" && <div className="card flat">
        <div className="label" style={{ paddingTop: 12 }}>Reglas de categoría</div>
        <p className="small" style={{ paddingBottom: 8 }}>Cuando la tienda contiene el texto, Monti la pone en esa categoría. Créalas desde un gasto en Gastos.</p>
        {(rules ?? []).length === 0 && <div className="empty">Aún no hay reglas.</div>}
        {(rules ?? []).map((r) => (
          <div key={r.id} className="tx">
            <span className="l">
              <span className="ci" style={{ background: category(r.category).bg }}>{category(r.category).icon}</span>
              <div><b>&ldquo;{r.match}&rdquo;</b><span className="small">→ {category(r.category).label}</span></div>
            </span>
            <form action={deleteRule.bind(null, r.id)}><button className="link" type="submit" style={{ color: "var(--bad)" }}>Quitar</button></form>
          </div>
        ))}
      </div>}

      <form action={signOut}><button className="btn danger" type="submit">Cerrar sesión</button></form>
    </>
  );
}
