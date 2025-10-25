"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createNetworkConfig,
  SuiClientProvider,
  WalletProvider,
} from "@mysten/dapp-kit";
import { getFullnodeUrl } from "@mysten/sui/client";
import { useEffect } from "react";
import { registerEnokiConnectWallets } from "@mysten/enoki-connect";

const queryClient = new QueryClient();

const networks = {
  mainnet: { url: getFullnodeUrl("mainnet") },
  testnet: { url: getFullnodeUrl("testnet") },
  devnet: { url: getFullnodeUrl("devnet") },
};
const { networkConfig } = createNetworkConfig(networks);

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const slugs = (process.env.NEXT_PUBLIC_ENOKI_PUBLIC_APP_SLUGS || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (slugs.length === 0) return;

    void registerEnokiConnectWallets({
      publicAppSlugs: slugs,
      dappName: process.env.NEXT_PUBLIC_DAPP_NAME || "Otter",
    }).catch((err) => {
      console.error("Failed to register Enoki Connect wallets:", err);
    });
  }, []);

  const active = (process.env.NEXT_PUBLIC_SUI_NETWORK || "testnet") as keyof typeof networks;

  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networkConfig} defaultNetwork={active}>
        <WalletProvider autoConnect>{children}</WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
}

