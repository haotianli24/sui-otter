"use client";

import { useCurrentAccount, useSignTransaction, useSuiClient } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { useState } from "react";

export function SponsorTest() {
  const acct = useCurrentAccount();
  const client = useSuiClient();
  const { mutateAsync: signTransaction } = useSignTransaction();
  const [status, setStatus] = useState<string>("");

  async function run() {
    if (!acct) return setStatus("Connect wallet first.");

    setStatus("Building tiny PTB...");
    const tx = new Transaction();

    // Minimal harmless PTB: split 1 MIST from gas then merge it back.
    const tiny = tx.splitCoins(tx.gas, [tx.pure.u64(1n)]);
    tx.mergeCoins(tx.gas, [tiny]);

    const kindBytes = await tx.build({ client, onlyTransactionKind: true });

    setStatus("Requesting sponsorship...");
    const sponsorRes = await fetch("/api/enoki/sponsor", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        kindBytesB64: Buffer.from(kindBytes).toString("base64"),
        sender: acct.address, // allowed by Enoki when no zklogin-jwt header
      }),
    }).then(r => r.json());

    if (!sponsorRes?.bytes || !sponsorRes?.digest) {
      setStatus("Sponsor failed.");
      return;
    }

    setStatus("Signing sponsored bytes...");
    const txToSign = Transaction.from(sponsorRes.bytes); // base64
    const { bytes, signature } = await signTransaction({ transaction: txToSign });

    setStatus("Submitting signature for execution...");
    const exec = await fetch("/api/enoki/execute", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ digest: sponsorRes.digest, signature }),
    }).then(r => r.json());

    if (exec?.digest) setStatus(`✅ Executed: ${exec.digest}`);
    else setStatus("Execution failed.");
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
