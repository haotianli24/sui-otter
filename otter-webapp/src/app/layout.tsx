import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import ClientLayout from "./client-layout";

const dmSans = DM_Sans({
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
            <body className={`${dmSans.variable} font-sans antialiased`}>
                <ClientLayout>{children}</ClientLayout>
            </body>
        </html>
    );
}
