"use client";

import { ConnectButton } from "@mysten/dapp-kit";
import { SponsorTest } from "@/components/ui/SponsorTest";

export default function HomeClient() {
  return (
    <div className="p-8 space-y-4">
      <ConnectButton />
      <SponsorTest />
    </div>
  );
}
