import { SuiClient } from '@mysten/sui/client';

export interface WalletScanResult {
  nftCount: number;
  transactionCount: number;
  defiProtocols: string[];
  activityLevel: 'beginner' | 'intermediate' | 'advanced';
}

// Known DeFi protocol package IDs on Sui (testnet/mainnet)
const KNOWN_PROTOCOLS: Record<string, string> = {
  'DeepBook': '0xdee9',
  'Cetus': '0x1eabed72c53feb3805120a081dc15963c204dc8d091542592abaf7a35689b2fb',
  'Turbos': '0x91bfbc386a41afcfd9b2533058d7e915a1d3829089cc268ff4333d54d6339ca1',
  'Aftermath': '0xefe170ec0be4d762196bedecd7a065816576198a6527c99282a2551aaa7da38c',
};

export async function scanNFTs(address: string, suiClient: SuiClient): Promise<number> {
  try {
    const objects = await suiClient.getOwnedObjects({
      owner: address,
      options: {
        showType: true,
      },
      limit: 50,
    });
    
    // Filter for NFTs (objects with display/image metadata)
    const nfts = objects.data.filter(obj => {
      const type = obj.data?.type;
      return type && !type.includes('::coin::Coin');
    });
    
    return nfts.length;
  } catch (error) {
    console.error('Error scanning NFTs:', error);
    return 0;
  }
}

export async function scanTransactions(address: string, suiClient: SuiClient): Promise<number> {
  try {
    const result = await suiClient.queryTransactionBlocks({
      filter: {
        FromAddress: address,
      },
      limit: 50,
    });
    
    return result.data.length;
  } catch (error) {
    console.error('Error scanning transactions:', error);
    return 0;
  }
}

export async function detectDeFiProtocols(address: string, suiClient: SuiClient): Promise<string[]> {
  try {
    const transactions = await suiClient.queryTransactionBlocks({
      filter: {
        FromAddress: address,
      },
      options: {
        showInput: true,
        showEffects: true,
      },
      limit: 50,
    });
    
    const protocols = new Set<string>();
    
    transactions.data.forEach(tx => {
      const txData = tx.transaction?.data;
      if (txData && 'transaction' in txData) {
        const packageId = String(txData);
        
        // Check if transaction interacted with known protocols
        Object.entries(KNOWN_PROTOCOLS).forEach(([protocol, id]) => {
          if (packageId.includes(id)) {
            protocols.add(protocol);
          }
        });
      }
    });
    
    return Array.from(protocols);
  } catch (error) {
    console.error('Error detecting DeFi protocols:', error);
    return [];
  }
}

export function generatePersonalitySummary(data: WalletScanResult): string {
  const { nftCount, transactionCount, defiProtocols, activityLevel } = data;
  
  const parts: string[] = [];
  
  // Activity level
  if (activityLevel === 'advanced') {
    parts.push('an active and experienced Sui user');
  } else if (activityLevel === 'intermediate') {
    parts.push('a growing Sui user');
  } else {
    parts.push('exploring the Sui ecosystem');
  }
  
  // NFT interest
  if (nftCount > 5) {
    parts.push('passionate about NFTs');
  } else if (nftCount > 0) {
    parts.push('interested in digital collectibles');
  }
  
  // DeFi engagement
  if (defiProtocols.length > 2) {
    parts.push(`actively trading on ${defiProtocols.join(', ')}`);
  } else if (defiProtocols.length > 0) {
    parts.push(`exploring DeFi on ${defiProtocols.join(', ')}`);
  }
  
  return parts.join(', ');
}

export async function scanWallet(address: string, suiClient: SuiClient): Promise<WalletScanResult> {
  const [nftCount, transactionCount, defiProtocols] = await Promise.all([
    scanNFTs(address, suiClient),
    scanTransactions(address, suiClient),
    detectDeFiProtocols(address, suiClient),
  ]);
  
  // Determine activity level
  let activityLevel: 'beginner' | 'intermediate' | 'advanced' = 'beginner';
  if (transactionCount > 50 || defiProtocols.length > 2) {
    activityLevel = 'advanced';
  } else if (transactionCount > 10 || defiProtocols.length > 0) {
    activityLevel = 'intermediate';
  }
  
  return {
    nftCount,
    transactionCount,
    defiProtocols,
    activityLevel,
  };
}

