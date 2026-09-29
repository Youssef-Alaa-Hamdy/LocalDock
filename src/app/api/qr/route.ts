import QRCode from "qrcode";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Render any text/URL as a crisp SVG QR code. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const text = url.searchParams.get("text") ?? "";
  if (!text || text.length > 2048) {
    return new Response("text query param required (max 2048 chars)", { status: 400 });
  }
  const svg = await QRCode.toString(text, {
    type: "svg",
    margin: 1,
    width: 512,
    errorCorrectionLevel: "M",
    color: { dark: "#0f172a", light: "#ffffff" },
  });
  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
