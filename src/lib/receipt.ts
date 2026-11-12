import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";

const client = new Anthropic();

const ReceiptSchema = z.object({
  is_receipt: z.boolean().describe("False if the image is not a receipt, invoice or payment screenshot"),
  merchant: z.string().describe("Store or business name, as a person would say it"),
  total: z.number().describe("Final total paid, as a number without currency symbol"),
  currency: z.enum(["GTQ", "USD", "MXN", "OTHER"]),
  date: z.string().describe("Purchase date as YYYY-MM-DD, or empty string if not visible"),
  category: z.enum(["housing", "food", "transport", "fun", "bills", "other"]),
  confidence: z.number().describe("0 to 1: how sure you are that merchant, total and date are correct"),
});
export type ReceiptReading = z.infer<typeof ReceiptSchema> & { model: string };

const SYSTEM = `You read photos of receipts, Guatemalan FEL invoices, Mexican CFDI invoices and screenshots of bank purchase notifications for a personal budgeting app in Guatemala.
Extract the store name, the final total actually paid (after discounts and tips, including tax), the currency and the purchase date.
Guatemalan amounts use "Q" for quetzales. If no currency is shown on a Guatemalan receipt, use GTQ.
Choose the budget category: housing (rent, mortgage, home repairs), food (supermarket and groceries), transport (fuel, Uber, parking, bus), fun (restaurants, cafes, cinema, entertainment, subscriptions like Netflix or Spotify), bills (electricity, water, phone, internet, insurance), other (anything else, pharmacy, clothes, gym).
Be honest in confidence: lower it when the photo is blurry, faded, cut off or the total is ambiguous.`;

async function read(model: string, base64: string, mediaType: "image/jpeg" | "image/png" | "image/webp") {
  const response = await client.messages.parse({
    model,
    max_tokens: 4000,
    system: SYSTEM,
    output_config: { effort: "low", format: zodOutputFormat(ReceiptSchema) },
    messages: [
      {
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
          { type: "text", text: "Read this receipt." },
        ],
      },
    ],
  });
  if (response.stop_reason === "refusal" || !response.parsed_output) return null;
  return { ...response.parsed_output, model };
}

/** Fast, low-cost model first; a stronger model only when the first reading is unsure. */
export async function readReceipt(base64: string, mediaType: "image/jpeg" | "image/png" | "image/webp"): Promise<ReceiptReading | null> {
  const first = await read("claude-haiku-5-5", base64, mediaType).catch(() => null);
  if (first && first.is_receipt && first.confidence >= 0.8) return first;
  const second = await read("claude-sonnet-5-5", base64, mediaType).catch(() => null);
  return second ?? first;
}
