// Shared constants and pure helpers (no server-only imports, safe in client components).
// Labels here are Spanish; screens translate them with t(label).
import { dateLocale, makeT, type Lang } from "./i18n";

export const CATEGORIES = [
  { id: "housing", label: "Vivienda", icon: "🏠", bg: "#E6F0FF" },
  { id: "food", label: "Súper", icon: "🛒", bg: "#E3F6EE" },
  { id: "transport", label: "Transporte", icon: "🚕", bg: "#FFF3DD" },
  { id: "fun", label: "Diversión", icon: "🎬", bg: "#FDE7EF" },
  { id: "bills", label: "Servicios", icon: "💡", bg: "#EEE9FF" },
  { id: "goals", label: "Metas", icon: "⛰️", bg: "#DDEFEC" },
  { id: "other", label: "Otros", icon: "🧾", bg: "#EEF1F6" },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"];
export const SPEND_CATEGORIES = CATEGORIES.filter((c) => c.id !== "goals");
export const VARIABLE_CATEGORIES: CategoryId[] = ["food", "transport", "fun", "other"];
export type Split = Record<CategoryId, number>;

export const TEMPLATES: Record<string, { label: string; hint: string; split: Split }> = {
  bal: {
    label: "Monti balanceado",
    hint: "Nuestra mezcla sugerida para la mayoría",
    split: { housing: 30, food: 15, transport: 10, fun: 10, bills: 10, goals: 20, other: 5 },
  },
  classic: {
    label: "Clásico 50/30/20",
    hint: "Necesidades 50%, gustos 30%, metas 20%",
    split: { housing: 25, food: 10, transport: 5, fun: 20, bills: 10, goals: 20, other: 10 },
  },
  saver: {
    label: "Modo ahorro",
    hint: "30% a metas, menos en diversión",
    split: { housing: 30, food: 12, transport: 8, fun: 5, bills: 10, goals: 30, other: 5 },
  },
};

export const GOAL_THEMES = [
  { id: "beach", label: "Viaje a la playa" },
  { id: "city", label: "Viaje a ciudad" },
  { id: "home", label: "Casa" },
  { id: "car", label: "Carro" },
  { id: "shield", label: "Fondo de emergencia" },
  { id: "study", label: "Estudios" },
] as const;

export const RELATIONSHIPS = [
  { id: "pareja", label: "Pareja" },
  { id: "hijo", label: "Hijo o hija" },
  { id: "papa", label: "Papá o mamá" },
  { id: "hermano", label: "Hermano o hermana" },
  { id: "amigo", label: "Amigo o amiga" },
  { id: "otro", label: "Otro familiar" },
] as const;
export const MAX_GOAL_PEOPLE = 5;

export function relationshipLabel(id: string | null | undefined) {
  return RELATIONSHIPS.find((r) => r.id === id)?.label ?? "Invitado";
}

export const USD_TO_GTQ = 7.7;

export function category(id: string) {
  return CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1];
}

export function money(amount: number, currency: string, decimals?: number) {
  const d = decimals ?? (Math.abs(amount) >= 1000 ? 0 : 2);
  const sym = currency === "USD" ? "$" : "Q";
  const n = Math.abs(amount).toLocaleString("es-GT", { minimumFractionDigits: d, maximumFractionDigits: d });
  return `${amount < 0 ? "-" : ""}${sym}${n}`;
}

/** Today's date in Guatemala as YYYY-MM-DD. */
export function todayISO(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Guatemala" }).format(now);
}

export function parseISO(s: string) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d || 1);
}

export function isoDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export const PERIODS = [
  { id: "today", label: "Hoy" },
  { id: "week", label: "Esta semana" },
  { id: "month", label: "Este mes" },
  { id: "year", label: "Este año" },
  { id: "all", label: "Todo" },
] as const;

/** Inclusive start and end dates for a period preset; weeks start on Monday. */
export function periodRange(p: string, today = todayISO()): { from: string | null; to: string | null } {
  if (p === "today") return { from: today, to: today };
  if (p === "week") {
    const start = parseISO(today);
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
    return { from: isoDate(start), to: today };
  }
  if (p === "month") return { from: `${today.slice(0, 7)}-01`, to: today };
  if (p === "year") return { from: `${today.slice(0, 4)}-01-01`, to: today };
  return { from: null, to: null };
}

export function monthInfo(today = todayISO(), lang: Lang = "es") {
  const d = parseISO(today);
  const year = d.getFullYear();
  const month = d.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const day = d.getDate();
  const start = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const end = `${year}-${String(month + 1).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;
  const name = d.toLocaleDateString(dateLocale(lang), { month: "long" });
  return { year, month, day, daysInMonth, daysLeft: daysInMonth - day + 1, start, end, name };
}

export function level(pct: number) {
  return pct >= 100 ? "bad" : pct >= 80 ? "warn" : "good";
}

export function weeksUntil(deadline: string, today = todayISO()) {
  const ms = parseISO(deadline).getTime() - parseISO(today).getTime();
  return Math.max(1, Math.ceil(ms / (7 * 864e5)));
}

export function friendlyDate(iso: string, today = todayISO(), lang: Lang = "es") {
  const t = makeT(lang);
  if (iso === today) return t("Hoy");
  const y = parseISO(today);
  y.setDate(y.getDate() - 1);
  const yISO = `${y.getFullYear()}-${String(y.getMonth() + 1).padStart(2, "0")}-${String(y.getDate()).padStart(2, "0")}`;
  if (iso === yISO) return t("Ayer");
  return parseISO(iso).toLocaleDateString(dateLocale(lang), { day: "numeric", month: "short" });
}

/** Category from the user's rules: the first rule whose text appears in the store name. */
export function ruleCategory(merchant: string, rules: { match: string; category: string }[]) {
  const m = merchant.toLowerCase();
  return rules.find((r) => m.includes(r.match.toLowerCase()))?.category ?? null;
}
