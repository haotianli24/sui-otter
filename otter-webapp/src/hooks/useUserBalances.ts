import { useQuery } from '@tanstack/react-query';
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';

export interface UserBalance {
  symbol: string;
  name: string;
  balanceFormatted: string;
  icon: string;
  balance: string;
  coinType: string;
}

// Token metadata with proper crypto logos
const TOKEN_METADATA: Record<string, { name: string; icon: string; coinType: string }> = {
  'SUI': {
    name: 'Sui',
    icon: 'https://cdn.prod.website-files.com/6425f546844727ce5fb9e5ab/659d970f53d2997773cf1db1_emblem-sui-d.svg',
    coinType: '0x2::sui::SUI'
  },
  'USDC': {
    name: 'USD Coin',
    icon: 'https://img.logokit.com/crypto/usdc',
    coinType: '0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN'
  },
  'USDT': {
    name: 'Tether USD',
    icon: 'https://img.logokit.com/crypto/usdt',
    coinType: '0xc060006111016b8a020ad5b33834984a437aaa7d3c74c18e09a95d1ace526f2::coin::COIN'
  },
  'WETH': {
    name: 'Wrapped Ethereum',
    icon: 'https://img.logokit.com/crypto/eth',
    coinType: '0xaf8cd5edc19c4512f4259f0bee101a40d41ebed738ade5874359610ef8dced2a::coin::COIN'
  },
  'WBTC': {
    name: 'Wrapped Bitcoin',
    icon: 'https://img.logokit.com/crypto/btc',
    coinType: '0x27792d9fed7f9844eb4839566001bb6f6cb4804f66aa2da6fe1ee242d896881::coin::COIN'
  }
};

export function useUserBalances() {
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();

  return useQuery({
    queryKey: ['user-balances', currentAccount?.address],
    queryFn: async (): Promise<UserBalance[]> => {
      if (!currentAccount?.address) {
        return [];
      }

      try {
        const balances: UserBalance[] = [];

        // Fetch balances for all supported tokens
        for (const [symbol, metadata] of Object.entries(TOKEN_METADATA)) {
          try {
            const balance = await suiClient.getBalance({
              owner: currentAccount.address,
              coinType: metadata.coinType,
            });

            // Convert from smallest unit to main unit
            // For SUI: 1 SUI = 1,000,000,000 MIST
            // For other tokens: assume 9 decimals (standard)
            const decimals = symbol === 'SUI' ? 9 : 9;
            const amount = parseFloat(balance.totalBalance) / Math.pow(10, decimals);

            // Only include tokens with non-zero balance
            if (amount > 0) {
              balances.push({
                symbol,
                name: metadata.name,
                balanceFormatted: amount.toFixed(6),
                icon: metadata.icon,
                balance: balance.totalBalance,
                coinType: metadata.coinType,
              });
            }
          } catch (tokenError) {
            // Skip tokens that don't exist or can't be fetched
            console.log(`Token ${symbol} not found or error fetching:`, tokenError);
          }
        }

        // If no balances found, return SUI with 0 balance
        if (balances.length === 0) {
          balances.push({
            symbol: 'SUI',
            name: 'Sui',
            balanceFormatted: '0.000000',
            icon: '🟡',
            balance: '0',
            coinType: '0x2::sui::SUI',
          });
        }

        return balances;
      } catch (error) {
        console.error('Error fetching user balances:', error);
        return [];
      }
    },
    enabled: !!currentAccount?.address,
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // 1 minute
  });
}
