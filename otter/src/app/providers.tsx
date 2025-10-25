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
    // Register Enoki wallets in the dApp Kit wallet modal
    // (experimental API; okay for hackathon)
    registerEnokiConnectWallets({
      publicAppSlugs: (process.env.NEXT_PUBLIC_ENOKI_PUBLIC_APP_SLUGS || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      dappName: process.env.NEXT_PUBLIC_DAPP_NAME || "Otter",
      // Optionally constrain networks: default supports mainnet/testnet/devnet
    });
  }, []);

  const active = (process.env.NEXT_PUBLIC_SUI_NETWORK || "testnet") as keyof typeof networks;

  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networkConfig} defaultNetwork={active}>
        <WalletProvider>{children}</WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
}

