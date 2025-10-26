import { createContext, ReactNode, useMemo, useContext } from 'react';
import { useSuiClient } from '@mysten/dapp-kit';
import { SealClient } from '@mysten/seal';
import { SuiStackMessagingClient, WalrusStorageAdapter } from '@mysten/messaging';
import { useSessionKey } from './SessionKeyProvider';
import { SuiClient } from '@mysten/sui/client';

// Hard-coded Seal server configurations for testnet
const SEAL_SERVERS = [
  '0x73d05d62c18d9374e3ea529e8e0ed6161da1a141a94d3f76ae3fe4e99356db75',
  '0xf5d14a81a982144ae441cd7d64b09027f116a468bd36e7eca494f750591623c8',
];

interface ExtendedClient {
  messaging: SuiStackMessagingClient;
  storage: WalrusStorageAdapter;
}

const MessagingClientContext = createContext<ExtendedClient | null>(null);

export const useMessagingClient = (): ExtendedClient | null => {
  const ctx = useContext(MessagingClientContext);
  if (ctx === undefined) {
    throw new Error('useMessagingClient must be used within a MessagingClientProvider');
  }
  return ctx;
};

export const MessagingClientProvider = ({
  children,
}: {
  children: ReactNode | ReactNode[];
}) => {
  const suiClient = useSuiClient();
  const { sessionKey } = useSessionKey();

  const messagingClient = useMemo(() => {
    if (!sessionKey) return null;

    try {
      // Create the extended client with SealClient
      const extendedClient = new SuiClient({
        url: "https://fullnode.mainnet.sui.io:443",
        mvr: {
          overrides: {
            packages: {
              '@local-pkg/sui-stack-messaging': "0x984960ebddd75c15c6d38355ac462621db0ffc7d6647214c802cd3b685e1af3d",
            },
          },
        },
      })
        .$extend(
          SealClient.asClientExtension({
            serverConfigs: SEAL_SERVERS.map((id) => ({
              objectId: id,
              weight: 1,
            })),
          })
        );

      // Create storage adapter
      const storage = new WalrusStorageAdapter(extendedClient, {
        publisher: 'https://publisher.walrus-mainnet.walrus.space',
        aggregator: 'https://aggregator.mainnet.walrus.mirai.cloud',
        epochs: 10,
      });

      // Create messaging client with storage
      const messaging = extendedClient.$extend(
        SuiStackMessagingClient.experimental_asClientExtension({
          storage: () => storage,
          sessionKey,
        })
      ).messaging;

      return {
        messaging,
        storage,
      };
    } catch (error) {
      console.error('Failed to create messaging client:', error);
      return null;
    }
  }, [suiClient, sessionKey]);

  return (
    <MessagingClientContext.Provider value={messagingClient}>
      {children}
    </MessagingClientContext.Provider>
  );
};