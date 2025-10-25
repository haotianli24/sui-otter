import { ConnectButton } from "@mysten/dapp-kit";
import { SponsorTest } from "@/components/ui/SponsorTest";

export default function Page() {
  return (
    <main className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold">Otter</h1>
      <p className="text-gray-600 mt-2">
        Next.js + Tailwind + shadcn + Supabase + Sui dApp Kit + Enoki
      </p>
      <div className="mt-6">
        <ConnectButton />
      </div>
      <SponsorTest />
    </main>
  );
}
