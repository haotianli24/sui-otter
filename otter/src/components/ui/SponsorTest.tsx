"use client";

import { useCurrentAccount, useSignTransaction, useSuiClient } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { toBase64 } from "@mysten/sui/utils";
import { useState } from "react";

export function SponsorTest() {
  const acct = useCurrentAccount();
  const client = useSuiClient();
  const { mutateAsync: signTransaction } = useSignTransaction();
  const [status, setStatus] = useState("");

  async function run() {
  if (!acct) return setStatus("Connect wallet first.");
  try {
    setStatus("Building tiny PTB...");
    const tx = new Transaction();

    const c = tx.splitCoins(tx.gas, [1]);  
    tx.mergeCoins(tx.gas, [c]);

    tx.setSenderIfNotSet(acct.address);

    const kindBytes = await tx.build({ client });

    setStatus("Requesting sponsorship...");
    const sponsorRes = await fetch("/api/enoki/sponsor", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        kindBytesB64: btoa(String.fromCharCode(...kindBytes)),
        sender: acct.address,
      }),
    }).then((r) => r.json());

    if (!sponsorRes?.bytes || !sponsorRes?.digest) {
      setStatus("Sponsor failed.");
      return;
    }

    setStatus("Signing sponsored bytes...");
    const txToSign = Transaction.from(sponsorRes.bytes);
    const { signature } = await signTransaction({ transaction: txToSign });

    setStatus("Submitting signature for execution...");
    const exec = await fetch("/api/enoki/execute", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ digest: sponsorRes.digest, signature }),
    }).then((r) => r.json());

    setStatus(exec?.digest ? `Executed: ${exec.digest}` : "Execution failed.");
  } catch (e: any) {
    console.log(e);
    setStatus(`Build failed: ${e?.message ?? e}`);
  }
}


  return (
    <div className="mt-6 space-y-3">
      <button onClick={run} className="px-4 py-2 rounded-xl bg-black text-white">
        Run sponsored smoke test
      </button>
      <div className="text-sm text-gray-600 whitespace-pre-line">{status}</div>
    </div>
  );
}
