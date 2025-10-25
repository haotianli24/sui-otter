import { NextResponse } from "next/server";


export async function POST(req: Request) {
  const { digest, signature } = await req.json();

  if (!process.env.ENOKI_SECRET_KEY) {
    return NextResponse.json({ error: "Missing ENOKI_SECRET_KEY" }, { status: 500 });
  }

  const res = await fetch(
    `https://api.enoki.mystenlabs.com/v1/transaction-blocks/sponsor/${digest}`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${process.env.ENOKI_SECRET_KEY}`,
      },
      body: JSON.stringify({ signature }),
    }
  );

  const json = await res.json();
  if (!res.ok) return NextResponse.json({ error: json }, { status: res.status });

  return NextResponse.json(json.data);
}
