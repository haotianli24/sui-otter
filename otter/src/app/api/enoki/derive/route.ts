// src/app/api/enoki/derive/route.ts
import { NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";
import { createClient } from "@supabase/supabase-js";
import { jwtToAddress } from "@mysten/sui/zklogin"; // typedoc lists in @mysten/sui zklogin module

// --- env ---
// NEXT_PUBLIC_GOOGLE_CLIENT_ID=...      (browser + server)
// NEXT_PUBLIC_SUPABASE_URL=...
// NEXT_PUBLIC_SUPABASE_ANON_KEY=...
// (Optional) a stable per-user salt store is better; we demo with a fixed salt:
const DEMO_USER_SALT = "12345678901234567890"; // replace with per-user salt in prod

const google = new OAuth2Client(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export async function POST(req: Request) {
  try {
    const { jwt, email, name } = await req.json();

    if (!jwt) {
      return NextResponse.json({ error: "Missing jwt" }, { status: 400 });
    }

    // 1) Verify the Google ID token (JWT)
    const ticket = await google.verifyIdToken({
      idToken: jwt,
      audience: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload?.sub || !payload?.iss || !payload?.aud) {
      return NextResponse.json({ error: "Invalid Google token" }, { status: 401 });
    }

    // 2) Derive zkLogin Sui address from the verified JWT + user salt
    // NOTE: jwtToAddress requires a salt (string | bigint). Use a stable per-user salt in prod.
    const address = jwtToAddress(jwt, DEMO_USER_SALT);

    // 3) Upsert to Supabase (id = address)
    const { data, error } = await supabase
      .from("users")
      .upsert(
        {
          id: address,
          address,
          email: email ?? payload.email ?? null,
          name: name ?? payload.name ?? null,
        },
        { onConflict: "id" }
      )
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

    return NextResponse.json({ address, user: data });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}
