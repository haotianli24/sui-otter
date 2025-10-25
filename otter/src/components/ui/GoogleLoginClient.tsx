// src/components/GoogleLoginClient.tsx
"use client";

import Script from "next/script";
import { useEffect, useRef } from "react";

export default function GoogleLoginClient() {
  const rendered = useRef(false);

  function handleCallback(response: google.accounts.id.CredentialResponse) {
    const jwt = response.credential;
    fetch("/api/enoki/derive", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jwt }),
    });
  }

  useEffect(() => {
    if (rendered.current) return;
    if (typeof window === "undefined" || !(window as any).google) return;

    window.google.accounts.id.initialize({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!, // set in .env.local
      callback: handleCallback,
    });

    window.google.accounts.id.renderButton(
      document.getElementById("gsi-btn")!,
      { theme: "outline", size: "large", type: "standard", shape: "rectangular" }
    );



    rendered.current = true;
  }, []);

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => {
        }}
      />
      <div id="gsi-btn" />
    </>
  );
}
