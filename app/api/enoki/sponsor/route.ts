import { NextResponse } from "next/server";

/**
 * POST /api/enoki/sponsor
 * Body: { kindBytesB64: string, sender?: string }
 * Returns: { digest: string, bytes: string }  // bytes = base64 sponsored TX bytes
 */
export async function POST(req: Request) {
  const { kindBytesB64, sender } = await req.json();

  if (!process.env.ENOKI_SECRET_KEY) {
    return NextResponse.json({ error: "Missing ENOKI_SECRET_KEY" }, { status: 500 });
  }

  const res = await fetch("https://api.enoki.mystenlabs.com/v1/transaction-blocks/sponsor", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      Authorization: `Bearer ${process.env.ENOKI_SECRET_KEY}`,
    },
    body: JSON.stringify({
      network: process.env.NEXT_PUBLIC_SUI_NETWORK || "testnet",
      transactionBlockKindBytes: kindBytesB64,
      sender, // optional; allowed by Enoki for server-sponsored flows
    }),
  });

  const json = await res.json();
  if (!res.ok) return NextResponse.json({ error: json }, { status: res.status });

  // Enoki returns { data: { digest, bytes } }
  return NextResponse.json(json.data);
}
