'use client';

import { ConnectButton } from '@mysten/dapp-kit';
import { useCurrentAccount } from '@mysten/dapp-kit';

export default function TestWallet() {
  const account = useCurrentAccount();

  return (
    <div className="min-h-screen bg-background p-8">
      <h1 className="text-2xl font-bold mb-4">Wallet Test Page</h1>
      
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold mb-2">Connect Wallet:</h2>
          <ConnectButton />
        </div>
        
        {account && (
          <div className="mt-4 p-4 bg-green-100 rounded-lg">
            <h3 className="font-semibold text-green-800">Wallet Connected!</h3>
            <p className="text-sm text-green-700">Address: {account.address}</p>
          </div>
        )}
        
        {!account && (
          <div className="mt-4 p-4 bg-gray-100 rounded-lg">
            <p className="text-gray-600">No wallet connected</p>
          </div>
        )}
      </div>
    </div>
  );
}

