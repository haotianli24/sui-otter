"use client";

import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ToastProvider } from "@/components/ui/toast";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/topbar";
import { MessagingProvider } from "@/contexts/messaging-context";
import { SessionKeyProvider } from "@/providers/SessionKeyProvider";
import { MessagingClientProvider } from "@/providers/MessagingClientProvider";
import { SuiClientProvider, WalletProvider } from "@mysten/dapp-kit";
import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createNetworkConfig } from "@mysten/dapp-kit";

// Sui network configuration - exactly like the example
const { networkConfig } = createNetworkConfig({
    devnet: { url: getFullnodeUrl("devnet") },
    testnet: { url: getFullnodeUrl("testnet") },
    mainnet: { url: getFullnodeUrl("mainnet") },
});

const queryClient = new QueryClient();

// Create client function like the example
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
    });
};

export default function ClientLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
        >
            <QueryClientProvider client={queryClient}>
                <SuiClientProvider createClient={createClient} networks={networkConfig} defaultNetwork="testnet">
                    <WalletProvider autoConnect>
                        <SessionKeyProvider>
                            <MessagingClientProvider>
                                <ToastProvider>
                                    <MessagingProvider>
                                        <div className="flex h-screen overflow-hidden">
                                            <Sidebar />
                                            <div className="flex-1 flex flex-col overflow-hidden">
                                                <TopBar />
                                                <main className="flex-1 overflow-auto">{children}</main>
                                            </div>
                                        </div>
                                    </MessagingProvider>
                                </ToastProvider>
                            </MessagingClientProvider>
                        </SessionKeyProvider>
                    </WalletProvider>
                </SuiClientProvider>
            </QueryClientProvider>
        </ThemeProvider>
    );
}

