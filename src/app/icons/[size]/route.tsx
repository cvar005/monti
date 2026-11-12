import { appIcon } from "@/lib/appIcon";

const SIZES = new Set([192, 512]);

// PNG icons for the web app manifest (Android install, splash screens).
export async function GET(_req: Request, { params }: RouteContext<"/icons/[size]">) {
  const px = Number((await params).size);
  if (!SIZES.has(px)) return new Response("Not found", { status: 404 });
  return appIcon(px);
}
