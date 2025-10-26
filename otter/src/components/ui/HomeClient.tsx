"use client";
import Link from "next/link";
import { ConnectButton } from "@mysten/dapp-kit";
import { SponsorTest } from "./SponsorTest";
import { WalletPaidTest } from "./WalletPaidTest";
import { Button } from "./button";
import { Bot } from "lucide-react";

export default function HomeClient() {
  return (
    <div className="mt-6 space-y-4">
      <ConnectButton />
      
      {/* AI Agents Section */}
      <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
        <div className="flex items-center gap-2 mb-2">
          <Bot className="h-5 w-5 text-blue-500" />
          <h3 className="font-semibold text-gray-900">AI Agents</h3>
        </div>
        <p className="text-sm text-gray-600 mb-3">
          Chat with Otter AI for Sui blockchain assistance
        </p>
        <Link href="/agents">
          <Button className="bg-blue-500 hover:bg-blue-600 text-white w-full">
            Explore AI Agents
          </Button>
        </Link>
      </div>
      
      <SponsorTest />
      <WalletPaidTest />
    </div>
  );
}
