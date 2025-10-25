import { NextResponse } from "next/server";
import { Transaction } from "@mysten/sui/transactions";


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
      sender, 
    }),
  });

  const json = await res.json();
  if (!res.ok) return NextResponse.json({ error: json }, { status: res.status });

  const data = json.data;
  const bytes = data?.bytes;
  let bytesB64: string | null = null;
  if (typeof bytes === "string") {
    if (bytes.startsWith("0x")) {
      let hex = bytes.slice(2);
      if (hex.length % 2 === 1) hex = "0" + hex;
      const buf = Buffer.from(hex, "hex");
      bytesB64 = buf.toString("base64");
    } else {
      let s = bytes;
      if (s.includes("-") || s.includes("_")) {
        s = s.replace(/-/g, "+").replace(/_/g, "/");
        const pad = s.length % 4;
        if (pad) s = s + "=".repeat(4 - pad);
      }
      bytesB64 = s;
    }
  } else if (Array.isArray(bytes)) {
    bytesB64 = Buffer.from(Uint8Array.from(bytes)).toString("base64");
  } else if (bytes?.type === "Buffer" && Array.isArray(bytes?.data)) {
    bytesB64 = Buffer.from(Uint8Array.from(bytes.data)).toString("base64");
  }

  if (!bytesB64) {
    return NextResponse.json({ error: "Invalid sponsor bytes format" }, { status: 500 });
  }

  data.bytes = bytesB64;
  try {
    const tx = Transaction.from(bytesB64);
    data.json = await tx.toJSON();
  } catch {}
  return NextResponse.json(data);
}
