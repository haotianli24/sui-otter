import { useQuery } from '@tanstack/react-query';
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';

export interface UserBalance {
  symbol: string;
  name: string;
  balanceFormatted: string;
  icon: string;
  balance: string;
}

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
        // Get SUI balance
        const suiBalance = await suiClient.getBalance({
          owner: currentAccount.address,
          coinType: '0x2::sui::SUI',
        });

        // Convert from MIST to SUI (1 SUI = 1,000,000,000 MIST)
        const suiAmount = parseFloat(suiBalance.totalBalance) / 1_000_000_000;

        return [
          {
            symbol: 'SUI',
            name: 'Sui',
            balanceFormatted: suiAmount.toFixed(6),
            icon: '🟡',
            balance: suiBalance.totalBalance,
          },
        ];
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
