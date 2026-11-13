import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { readReceipt } from "@/lib/receipt";
import { getT } from "@/lib/lang";
import { ruleCategory, todayISO, USD_TO_GTQ } from "@/lib/monti";

const MAX_BYTES = 5 * 1024 * 1024;
const TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export async function POST(request: Request) {
  const { t } = await getT();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: t("Inicia sesión para escanear.") }, { status: 401 });

  const form = await request.formData();
  const file = form.get("image");
  if (!(file instanceof File)) return NextResponse.json({ error: t("No llegó ninguna imagen.") }, { status: 400 });
  const mediaType = TYPES.find((t) => t === file.type);
  if (!mediaType) return NextResponse.json({ error: t("Usa una foto JPG, PNG o WebP.") }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: t("La foto pesa más de 5 MB.") }, { status: 400 });

  const bytes = Buffer.from(await file.arrayBuffer());

  // Keep the original receipt in the user's private folder
  const path = `${user.id}/${Date.now()}.${mediaType.split("/")[1]}`;
  const upload = await supabase.storage.from("receipts").upload(path, bytes, { contentType: mediaType });

  const reading = await readReceipt(bytes.toString("base64"), mediaType);
  if (!reading) {
    return NextResponse.json({ error: t("No pudimos leer el recibo. Llénalo a mano.") }, { status: 422 });
  }
  if (!reading.is_receipt) {
    return NextResponse.json({ error: t("Eso no parece un recibo. Intenta con otra foto.") }, { status: 422 });
  }

  const [{ data: profile }, { data: rules }] = await Promise.all([
    supabase.from("profiles").select("currency").eq("id", user.id).single(),
    supabase.from("rules").select("match, category"),
  ]);
  const currency = profile?.currency ?? "GTQ";

  // Convert between quetzales and dollars at a fixed rate; other currencies are left for the user to fix
  let amount = reading.total;
  if (reading.currency === "USD" && currency === "GTQ") amount = reading.total * USD_TO_GTQ;
  if (reading.currency === "GTQ" && currency === "USD") amount = reading.total / USD_TO_GTQ;

  const today = todayISO();
  const date = /^\d{4}-\d{2}-\d{2}$/.test(reading.date) && reading.date <= today ? reading.date : today;

  return NextResponse.json({
    merchant: reading.merchant,
    amount: Math.round(amount * 100) / 100,
    originalTotal: reading.total,
    originalCurrency: reading.currency,
    category: ruleCategory(reading.merchant, rules ?? []) ?? reading.category,
    date,
    confidence: reading.confidence,
    receiptPath: upload.error ? null : path,
  });
}
