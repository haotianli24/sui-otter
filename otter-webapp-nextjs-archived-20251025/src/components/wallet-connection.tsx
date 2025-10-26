"use client";

import { useCurrentAccount, useConnectWallet, useDisconnectWallet } from "@mysten/dapp-kit";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function WalletConnection() {
  const currentAccount = useCurrentAccount();
  const { mutate: connect } = useConnectWallet();
  const { mutate: disconnect } = useDisconnectWallet();

  if (!currentAccount) {
    return (
      <Button onClick={() => connect({ wallet: undefined as any })}>
        Connect Wallet
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          {currentAccount.address.slice(0, 6)}...{currentAccount.address.slice(-4)}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Wallet</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="font-mono text-xs">
          {currentAccount.address}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => disconnect()}>
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
