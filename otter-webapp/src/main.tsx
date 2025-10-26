import React from "react";
import ReactDOM from "react-dom/client";
import "@mysten/dapp-kit/dist/index.css";
import "@radix-ui/themes/styles.css";
import "./index.css";

import { SuiClientProvider, WalletProvider } from "@mysten/dapp-kit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App.tsx";
import { getFullnodeUrl } from "@mysten/sui/client";
import { createNetworkConfig } from "@mysten/dapp-kit";
import { SuiClient } from "@mysten/sui/client";
import { ThemeProvider } from "./components/theme-provider";

const queryClient = new QueryClient();

const { networkConfig } = createNetworkConfig({
    devnet: { url: getFullnodeUrl("devnet") },
    testnet: { url: getFullnodeUrl("testnet") },
    mainnet: { url: getFullnodeUrl("mainnet") },
});

const createClient = () => {
    return new SuiClient({
        url: "https://fullnode.testnet.sui.io:443",
        mvr: {
            overrides: {
                packages: {
                    '@local-pkg/sui-stack-messaging': "0x984960ebddd75c15c6d38355ac462621db0ffc7d6647214c802cd3b685e1af3d",
                },
            },
        },
    })
}

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <ThemeProvider defaultTheme="system" storageKey="otter-ui-theme">
            <QueryClientProvider client={queryClient}>
                <SuiClientProvider createClient={createClient} networks={networkConfig} defaultNetwork="testnet">
                    <WalletProvider autoConnect>
                        <App />
                    </WalletProvider>
                </SuiClientProvider>
            </QueryClientProvider>
        </ThemeProvider>
    </React.StrictMode>,
);

