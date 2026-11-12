// Reads one receipt image with the same prompt and models as the app. Usage:
//   node --env-file=.env.local scripts/test-receipt.mts path/to/receipt.jpg
import fs from "node:fs";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";

const ReceiptSchema = z.object({
  is_receipt: z.boolean(),
  merchant: z.string(),
  total: z.number(),
  currency: z.enum(["GTQ", "USD", "MXN", "OTHER"]),
  date: z.string(),
  category: z.enum(["housing", "food", "transport", "fun", "bills", "other"]),
  confidence: z.number(),
});

const client = new Anthropic();
const data = fs.readFileSync(process.argv[2]).toString("base64");

for (const model of ["claude-haiku-5-5", "claude-sonnet-5-5"]) {
  const t0 = Date.now();
  const res = await client.messages.parse({
    model,
    max_tokens: 4000,
    system: "You read photos of receipts and Guatemalan FEL invoices for a budgeting app. Extract store, final total paid, currency, date (YYYY-MM-DD) and category. Be honest in confidence.",
    output_config: { effort: "low", format: zodOutputFormat(ReceiptSchema) },
    messages: [{ role: "user", content: [{ type: "image", source: { type: "base64", media_type: "image/jpeg", data } }, { type: "text", text: "Read this receipt." }] }],
  });
  console.log(model, `${Date.now() - t0}ms`, res.stop_reason, JSON.stringify(res.parsed_output), `in=${res.usage.input_tokens} out=${res.usage.output_tokens}`);
}
