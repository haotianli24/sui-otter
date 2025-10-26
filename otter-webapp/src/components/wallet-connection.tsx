"use client";

import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";

export function WalletConnection() {
  const currentAccount = useCurrentAccount();

  return (
    <div className="flex items-center gap-4">
      <ConnectButton />
      {currentAccount && (
        <div className="text-xs text-muted-foreground">
          Connected: {currentAccount.address.slice(0, 6)}...{currentAccount.address.slice(-4)}
        </div>
      )}
    </div>
  );
}
