import { requireFullAccess } from "@/lib/data";
import { todayISO } from "@/lib/monti";
import AddExpense from "./AddExpense";

export default async function AddPage() {
  const { supabase, profile } = await requireFullAccess();
  const { data: rules } = await supabase.from("rules").select("match, category");
  return <AddExpense currency={profile.currency} rules={rules ?? []} today={todayISO()} />;
}
