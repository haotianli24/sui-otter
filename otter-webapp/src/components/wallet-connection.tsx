"use client";

import { ConnectButton } from "@mysten/dapp-kit";

export function WalletConnection() {
  return (
    <div className="flex items-center gap-4">
      <ConnectButton />
    </div>
  );
}
