"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useT } from "./LangProvider";
import { IconBudget, IconGoals, IconHome, IconList, IconScan, IconUser } from "./Icons";

const TABS = [
  { href: "/", label: "Inicio", Icon: IconHome },
  { href: "/presupuesto", label: "Presupuesto", Icon: IconBudget },
  { href: "/agregar", label: "Agregar", Icon: IconScan, fab: true },
  { href: "/metas", label: "Metas", Icon: IconGoals },
  { href: "/movimientos", label: "Gastos", Icon: IconList },
];

const GUEST_TABS = [
  { href: "/metas", label: "Metas", Icon: IconGoals },
  { href: "/ajustes", label: "Mi cuenta", Icon: IconUser },
];

export default function Tabs({ guest = false }: { guest?: boolean }) {
  const path = usePathname();
  const t = useT();
  const tabs: { href: string; label: string; Icon: () => React.JSX.Element; fab?: boolean }[] = guest ? GUEST_TABS : TABS;
  return (
    <nav className="tabs" aria-label={t("Principal")} style={guest ? { gridTemplateColumns: "1fr 1fr" } : undefined}>
      {tabs.map(({ href, label, Icon, fab }) => {
        const active = href === "/" ? path === "/" : path.startsWith(href);
        return (
          <Link key={href} href={href} aria-current={active ? "page" : undefined} className={fab ? "fab" : undefined}>
            {fab ? <span className="ic"><Icon /></span> : <Icon />}
            {t(label)}
          </Link>
        );
      })}
    </nav>
  );
}
