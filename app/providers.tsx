"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createNetworkConfig,
  SuiClientProvider,
  WalletProvider,
} from "@mysten/dapp-kit";
import { getFullnodeUrl } from "@mysten/sui/client";
import { useEffect } from "react";
// import { registerEnokiConnectWallets } from "@mysten/enoki-connect";

const queryClient = new QueryClient();

const networks = {
  mainnet: { url: getFullnodeUrl("mainnet") },
  testnet: { url: getFullnodeUrl("testnet") },
  devnet: { url: getFullnodeUrl("devnet") },
};
const { networkConfig } = createNetworkConfig(networks);

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Skip Enoki wallet registration for now
    console.log("Wallet providers initialized");
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

