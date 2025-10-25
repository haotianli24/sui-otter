import type { Metadata } from "next";
import { Open_Sans } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ToastProvider } from "@/components/ui/toast";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/topbar";

const openSans = Open_Sans({
    subsets: ["latin"],
    variable: "--font-sans",
});

export const metadata: Metadata = {
    title: "Otter - Decentralized Social Trading",
    description: "Built on Sui blockchain",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={`${openSans.variable} font-sans antialiased`}>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="dark"
                    enableSystem
                    disableTransitionOnChange
                >
                    <ToastProvider>
                        <div className="flex h-screen overflow-hidden">
                            <Sidebar />
                            <div className="flex-1 flex flex-col overflow-hidden">
                                <TopBar />
                                <main className="flex-1 overflow-auto">{children}</main>
                            </div>
                        </div>
                    </ToastProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}

