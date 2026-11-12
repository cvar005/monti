import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CATEGORIES, monthInfo, todayISO, VARIABLE_CATEGORIES, type CategoryId, type Split } from "@/lib/monti";

export type Profile = {
  id: string;
  name: string;
  currency: "GTQ" | "USD";
  income: number;
  split: Split;
  onboarded: boolean;
  plan: string;
};

export type Transaction = {
  id: string;
  merchant: string;
  amount: number;
  category: CategoryId;
  date: string;
  source: string;
  ai_confidence: number | null;
  reviewed: boolean;
};

export type Goal = {
  id: string;
  owner_id: string;
  name: string;
  target: number;
  deadline: string;
  theme: string;
  owner_share: number;
};

/** Signed-in user + profile. Sends visitors to /login and new users to /onboarding. */
export const requireProfile = cache(async function requireProfile(allowNotOnboarded = false) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  const profile = data as Profile | null;
  if (!profile) redirect("/login");
  if (!profile.onboarded && !allowNotOnboarded) redirect("/onboarding");
  return { supabase, user, profile };
});

/** Same as requireProfile, but goal guests (invited for free) only get the goals screens. */
export async function requireFullAccess() {
  const ctx = await requireProfile();
  if (ctx.profile.plan === "guest") redirect("/metas");
  return ctx;
}

export type MonthSummary = Awaited<ReturnType<typeof getMonthSummary>>;

/** Everything the home and budget screens need for the current month. */
export async function getMonthSummary() {
  const { supabase, user, profile } = await requireFullAccess();
  const m = monthInfo();
  const [{ data: tx }, { data: contrib }] = await Promise.all([
    supabase
      .from("transactions")
      .select("id, merchant, amount, category, date, source, ai_confidence, reviewed")
      .gte("date", m.start)
      .lte("date", m.end)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase.from("contributions").select("amount").eq("user_id", user.id).gte("date", m.start).lte("date", m.end),
  ]);
  const transactions = ((tx ?? []) as Transaction[]).map((t) => ({ ...t, amount: Number(t.amount) }));
  const contributed = (contrib ?? []).reduce((s, c) => s + Number(c.amount), 0);

  const cats = CATEGORIES.map((c) => {
    const budget = (Number(profile.income) * (profile.split[c.id] ?? 0)) / 100;
    const spent =
      c.id === "goals" ? contributed : transactions.filter((t) => t.category === c.id).reduce((s, t) => s + t.amount, 0);
    const projected = VARIABLE_CATEGORIES.includes(c.id) ? (spent * m.daysInMonth) / m.day : Math.max(spent, budget);
    return { ...c, budget, spent, pct: budget ? (spent / budget) * 100 : spent > 0 ? 100 : 0, projected };
  });
  const spendCats = cats.filter((c) => c.id !== "goals");
  const totalBudget = spendCats.reduce((s, c) => s + c.budget, 0);
  const totalSpent = spendCats.reduce((s, c) => s + c.spent, 0);
  const safeToday = spendCats.reduce((s, c) => s + Math.max(0, c.budget - c.spent), 0) / m.daysLeft;

  // Cumulative spending by day for the pace chart (goals excluded)
  const byDay: number[] = [];
  let cum = 0;
  for (let d = 1; d <= m.day; d++) {
    const iso = `${m.start.slice(0, 8)}${String(d).padStart(2, "0")}`;
    cum += transactions.filter((t) => t.date === iso).reduce((s, t) => s + t.amount, 0);
    byDay.push(cum);
  }

  return { profile, month: m, today: todayISO(), transactions, cats, spendCats, totalBudget, totalSpent, safeToday, byDay };
}

export async function getGoalsWithProgress() {
  const { supabase, user, profile } = await requireProfile();
  const { data: goals } = await supabase.from("goals").select("*").order("created_at");
  const ids = (goals ?? []).map((g) => g.id);
  const [{ data: contrib }, { data: members }] = await Promise.all([
    ids.length ? supabase.from("contributions").select("goal_id, user_id, amount, date").in("goal_id", ids) : { data: [] },
    ids.length ? supabase.from("goal_members").select("goal_id, user_id, role").in("goal_id", ids) : { data: [] },
  ]);
  const list = ((goals ?? []) as Goal[]).map((g) => {
    const rows = (contrib ?? []).filter((c) => c.goal_id === g.id);
    const saved = rows.reduce((s, c) => s + Number(c.amount), 0);
    const people = (members ?? []).filter((mm) => mm.goal_id === g.id);
    return { ...g, target: Number(g.target), saved, shared: people.length > 1, memberCount: people.length };
  });
  return { user, profile, goals: list };
}
