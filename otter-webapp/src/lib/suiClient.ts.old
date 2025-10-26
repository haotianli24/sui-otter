// src/lib/suiClient.ts
import { SuiClient } from "@mysten/sui/client";
import { SealClient } from "@mysten/seal";
import { SuiStackMessagingClient } from "@mysten/messaging";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";

// Example: the user's connected wallet/account will sign transactions
export function getSuiMessagingClient(signer: Ed25519Keypair) {
  const client = new SuiClient({ url: "https://fullnode.testnet.sui.io:443" });
  
  // Add Seal extension
  const clientWithSeal = client.$extend(
    SealClient.asClientExtension({
      serverConfigs: [
        { objectId: "0x73d05d62c18d9374e3ea529e8e0ed6161da1a141a94d3f76ae3fe4e99356db75", weight: 1 },
        { objectId: "0xf5d14a81a982144ae441cd7d64b09027f116a468bd36e7eca494f750591623c8", weight: 1 }
      ]
    })
  );

  // Add messaging extension with type assertion to handle compatibility issues
  return (clientWithSeal as any).$extend(
    SuiStackMessagingClient.experimental_asClientExtension({
      walrusStorageConfig: {
        aggregator: "https://aggregator.walrus-testnet.walrus.space",
        publisher: "https://publisher.walrus-testnet.walrus.space",
        epochs: 1,
      },
      sessionKeyConfig: {
        address: signer.toSuiAddress(),
        ttlMin: 30,
        signer: signer as any, // Type assertion to handle compatibility
      },
    })
  );
}
