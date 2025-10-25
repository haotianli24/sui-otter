"use client";

import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { useState } from "react";

export function WalletPaidTest() {
  const acct = useCurrentAccount();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const [status, setStatus] = useState("");
  const client = useSuiClient();

  const run = async () => {
    if (!acct) return setStatus("Connect a wallet first.");

    try {
      setStatus("Building wallet-paid PTB...");
      const tx = new Transaction();
      const c = tx.splitCoins(tx.gas, [1]);   // tiny coin op (1 MIST)
      tx.mergeCoins(tx.gas, [c]);
      const kindBytes = await tx.build({ client, onlyTransactionKind: true });

      // Wallet pays gas directly:
      const res = await signAndExecute({ transaction: tx });
      setStatus(`✅ Executed (wallet-paid): ${res.digest ?? "(no digest)"}`);
    } catch (e: any) {
      setStatus(`Error: ${e?.message ?? e}`);
    }
  };

  return (
    <div className="mt-4 space-y-2">
      <button onClick={run} className="rounded-lg bg-black px-4 py-2 text-white">
        Run wallet-paid test
      </button>
      <div className="text-sm text-gray-600">{status}</div>
    </div>
  );
}
