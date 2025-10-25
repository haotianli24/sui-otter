"use client";

import { Open_Sans } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ToastProvider } from "@/components/ui/toast";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/topbar";
import { MessagingProvider } from "@/contexts/messaging-context";
import { SuiClientProvider, WalletProvider } from "@mysten/dapp-kit";
import { getFullnodeUrl } from "@mysten/sui/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createNetworkConfig } from "@mysten/dapp-kit";

const openSans = Open_Sans({
    subsets: ["latin"],
    variable: "--font-sans",
});

// Sui network configuration
const networks = {
    mainnet: { url: getFullnodeUrl("mainnet") },
    testnet: { url: getFullnodeUrl("testnet") },
    devnet: { url: getFullnodeUrl("devnet") },
};

const { networkConfig } = createNetworkConfig(networks);
const queryClient = new QueryClient();

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
                <SuiClientProvider networks={networkConfig} defaultNetwork="testnet">
                    <WalletProvider autoConnect>
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
                    </WalletProvider>
                </SuiClientProvider>
            </QueryClientProvider>
        </ThemeProvider>
    );
}

