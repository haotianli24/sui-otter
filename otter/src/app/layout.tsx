import "./globals.css";
import { Providers } from "@/app/providers";

export const metadata = { title: "Otter", description: "Sui + Enoki scaffold" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-gray-900">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
