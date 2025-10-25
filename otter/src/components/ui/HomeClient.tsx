"use client";
import { ConnectButton } from "@mysten/dapp-kit";
import { SponsorTest } from "./SponsorTest";
import { WalletPaidTest } from "./WalletPaidTest";

export default function HomeClient() {
  return (
    <div className="mt-6 space-y-4">
      <ConnectButton />
      <SponsorTest />
      <WalletPaidTest />
    </div>
  );
}
