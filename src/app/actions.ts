"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CATEGORIES, category, MAX_GOAL_PEOPLE, monthInfo, money, RELATIONSHIPS, todayISO, type Split } from "@/lib/monti";

async function session() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

function validSplit(split: Split) {
  const total = CATEGORIES.reduce((s, c) => s + (Number(split[c.id]) || 0), 0);
  return total === 100;
}

// ---------- Onboarding & profile ----------

export async function completeOnboarding(input: {
  name: string;
  currency: "GTQ" | "USD";
  income: number;
  split: Split;
  goal: { name: string; target: number; deadline: string; theme: string } | null;
}) {
  const { supabase, user } = await session();
  if (!input.name.trim() || !(input.income > 0) || !validSplit(input.split)) {
    return { error: "Revisa tu nombre, tu ingreso y que el reparto sume 100%." };
  }
  const { error } = await supabase
    .from("profiles")
    .update({ name: input.name.trim(), currency: input.currency, income: input.income, split: input.split, onboarded: true })
    .eq("id", user.id);
  if (error) return { error: "No pudimos guardar tu perfil. Intenta de nuevo." };
  if (input.goal && input.goal.name.trim() && input.goal.target > 0 && input.goal.deadline > todayISO()) {
    await supabase.from("goals").insert({
      name: input.goal.name.trim(),
      target: input.goal.target,
      deadline: input.goal.deadline,
      theme: input.goal.theme,
    });
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function updateProfile(formData: FormData) {
  const { supabase, user } = await session();
  const name = String(formData.get("name") ?? "").trim();
  const currency = formData.get("currency") === "USD" ? "USD" : "GTQ";
  if (name) await supabase.from("profiles").update({ name, currency }).eq("id", user.id);
  revalidatePath("/", "layout");
}

export async function updateBudget(input: { income: number; split: Split }) {
  const { supabase, user } = await session();
  if (!(input.income > 0) || !validSplit(input.split)) return { error: "El reparto debe sumar 100%." };
  await supabase.from("profiles").update({ income: input.income, split: input.split }).eq("id", user.id);
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

// ---------- Expenses ----------

/** Saves an expense and returns a budget alert when this expense crosses 80% or 100% of its category. */
export async function addTransaction(input: {
  merchant: string;
  amount: number;
  category: string;
  date: string;
  source: "manual" | "scan";
  receiptPath?: string | null;
  confidence?: number | null;
}) {
  const { supabase, user } = await session();
  const merchant = input.merchant.trim();
  const today = todayISO();
  if (!merchant || !(input.amount > 0)) return { error: "Agrega la tienda y un monto." };
  if (!CATEGORIES.some((c) => c.id === input.category && c.id !== "goals")) return { error: "Elige una categoría." };
  const date = /^\d{4}-\d{2}-\d{2}$/.test(input.date) && input.date <= today ? input.date : today;

  const m = monthInfo(today);
  const [{ data: profile }, { data: monthTx }] = await Promise.all([
    supabase.from("profiles").select("income, split, currency").eq("id", user.id).single(),
    supabase.from("transactions").select("amount").eq("category", input.category).gte("date", m.start).lte("date", m.end),
  ]);
  const { error } = await supabase.from("transactions").insert({
    merchant,
    amount: Math.round(input.amount * 100) / 100,
    category: input.category,
    date,
    source: input.source,
    receipt_path: input.receiptPath ?? null,
    ai_confidence: input.confidence ?? null,
  });
  if (error) return { error: "No pudimos guardar el gasto. Intenta de nuevo." };
  revalidatePath("/", "layout");

  const saved = `${money(input.amount, profile?.currency ?? "GTQ")} guardado en ${category(input.category).label}.`;
  if (!profile || date < m.start) return { ok: true, message: saved, level: "good" as const };
  const budget = (Number(profile.income) * ((profile.split as Split)[input.category as keyof Split] ?? 0)) / 100;
  const before = (monthTx ?? []).reduce((s, t) => s + Number(t.amount), 0);
  const after = before + input.amount;
  const label = category(input.category).label;
  if (budget > 0 && after >= budget && before < budget) {
    return { ok: true, level: "bad" as const, message: `${label} se pasó del presupuesto por ${money(after - budget, profile.currency, 0)}.` };
  }
  if (budget > 0 && after >= budget * 0.8 && before < budget * 0.8) {
    return { ok: true, level: "warn" as const, message: `Ojo: ${label} va en ${Math.round((after / budget) * 100)}% de su presupuesto.` };
  }
  return { ok: true, level: "good" as const, message: saved };
}

export async function setTransactionCategory(id: string, newCategory: string) {
  const { supabase } = await session();
  if (!CATEGORIES.some((c) => c.id === newCategory && c.id !== "goals")) return;
  await supabase.from("transactions").update({ category: newCategory }).eq("id", id);
  revalidatePath("/", "layout");
}

export async function updateTransaction(id: string, input: { merchant: string; amount: number; category: string; date: string }) {
  const { supabase } = await session();
  const merchant = input.merchant.trim();
  if (!merchant || !(input.amount > 0)) return { error: "Agrega la tienda y un monto." };
  if (!CATEGORIES.some((c) => c.id === input.category && c.id !== "goals")) return { error: "Elige una categoría." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date) || input.date > todayISO()) return { error: "Elige una fecha de hoy o antes." };
  const { error } = await supabase
    .from("transactions")
    .update({ merchant, amount: Math.round(input.amount * 100) / 100, category: input.category, date: input.date, reviewed: true })
    .eq("id", id);
  if (error) return { error: "No pudimos guardar el cambio. Intenta de nuevo." };
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteTransaction(id: string) {
  const { supabase } = await session();
  await supabase.from("transactions").delete().eq("id", id);
  revalidatePath("/", "layout");
}

export async function markAllReviewed() {
  const { supabase } = await session();
  await supabase.from("transactions").update({ reviewed: true }).eq("reviewed", false);
  revalidatePath("/", "layout");
}

// ---------- Category rules ----------

export async function addRule(match: string, cat: string) {
  const { supabase } = await session();
  const text = match.trim();
  if (!text || !CATEGORIES.some((c) => c.id === cat && c.id !== "goals")) return;
  await supabase.from("rules").delete().ilike("match", text);
  await supabase.from("rules").insert({ match: text, category: cat });
  revalidatePath("/", "layout");
}

export async function deleteRule(id: string) {
  const { supabase } = await session();
  await supabase.from("rules").delete().eq("id", id);
  revalidatePath("/", "layout");
}

// ---------- Goals ----------

export async function createGoal(formData: FormData) {
  const { supabase } = await session();
  const name = String(formData.get("name") ?? "").trim();
  const target = Number(formData.get("target"));
  const month = String(formData.get("deadline") ?? "");
  const theme = String(formData.get("theme") ?? "beach");
  const deadline = /^\d{4}-\d{2}$/.test(month) ? `${month}-01` : "";
  if (!name || !(target > 0) || !deadline || deadline <= todayISO()) {
    redirect("/metas/nueva?error=1");
  }
  const { data, error } = await supabase.from("goals").insert({ name, target, deadline, theme }).select("id").single();
  if (error || !data) redirect("/metas/nueva?error=1");
  revalidatePath("/", "layout");
  redirect(`/metas/${data.id}?nueva=1`);
}

export async function addContribution(goalId: string, amount: number) {
  const { supabase } = await session();
  if (!(amount > 0)) return { error: "Escribe un monto." };
  const { data: goal } = await supabase.from("goals").select("target").eq("id", goalId).single();
  const { data: rows } = await supabase.from("contributions").select("amount").eq("goal_id", goalId);
  const before = (rows ?? []).reduce((s, r) => s + Number(r.amount), 0);
  const { error } = await supabase.from("contributions").insert({ goal_id: goalId, amount: Math.round(amount * 100) / 100 });
  if (error) return { error: "No pudimos guardar el aporte." };
  revalidatePath("/", "layout");
  const target = Number(goal?.target ?? 0);
  const milestone = target ? [25, 50, 75, 100].find((p) => (before / target) * 100 < p && ((before + amount) / target) * 100 >= p) : undefined;
  return { ok: true, milestone };
}

export async function setGoalShare(goalId: string, ownerShare: number) {
  const { supabase } = await session();
  const share = Math.max(10, Math.min(90, Math.round(ownerShare / 10) * 10));
  await supabase.from("goals").update({ owner_share: share }).eq("id", goalId);
  revalidatePath(`/metas/${goalId}`);
}

export async function deleteGoal(goalId: string) {
  const { supabase } = await session();
  await supabase.from("goals").delete().eq("id", goalId);
  revalidatePath("/", "layout");
  redirect("/metas");
}

export async function createInvite(goalId: string, relationship: string) {
  const { supabase } = await session();
  const rel = RELATIONSHIPS.some((r) => r.id === relationship) ? relationship : "otro";
  const { count } = await supabase.from("goal_members").select("user_id", { count: "exact", head: true }).eq("goal_id", goalId);
  if ((count ?? 0) >= MAX_GOAL_PEOPLE) return { error: `Una meta puede tener hasta ${MAX_GOAL_PEOPLE} personas.` };
  const { data, error } = await supabase.from("goal_invites").insert({ goal_id: goalId, relationship: rel }).select("code").single();
  if (error || !data) return { error: "No pudimos crear la invitación." };
  return { code: data.code as string };
}

export async function acceptInvite(code: string, formData: FormData) {
  const { supabase } = await session();
  const name = String(formData.get("name") ?? "").trim();
  const { data, error } = await supabase.rpc("accept_goal_invite", { invite_code: code, guest_name: name || null });
  if (error || !data) {
    const reason = error?.message.includes("goal_full") ? "full" : "used";
    redirect(`/unirse/${encodeURIComponent(code)}?error=${reason}`);
  }
  revalidatePath("/", "layout");
  redirect(`/metas/${data}`);
}

export async function leaveGoal(goalId: string) {
  const { supabase, user } = await session();
  await supabase.from("goal_members").delete().eq("goal_id", goalId).eq("user_id", user.id);
  revalidatePath("/", "layout");
  redirect("/metas");
}

/** A goal guest turns on the whole app. Payment is collected once billing opens; for now everyone joins as a founder. */
export async function activateFullApp() {
  const { supabase, user } = await session();
  await supabase.from("profiles").update({ plan: "founding", onboarded: false }).eq("id", user.id).eq("plan", "guest");
  revalidatePath("/", "layout");
  redirect("/onboarding");
}
