import { useQuery } from "@tanstack/react-query";
import { useCurrentAccount, useSuiClient } from "@mysten/dapp-kit";

const COMMUNITY_PACKAGE_ID = '0x7de4958f7ba9d65318f2ab9a08ecbc51d103f9eac9030ffca517e5b0bf5b69ed';

export interface Group {
  id: string;
  name: string;
  description: string;
  type: 'free' | 'paid';
  price: number | undefined;
  maxMembers: number;
  currentMembers: number;
  creator: string;
  createdAt: string;
  avatar: string | undefined;
}

export function useUserGroups() {
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();

  return useQuery({
    queryKey: ['user-groups', currentAccount?.address],
    queryFn: async (): Promise<Group[]> => {
      if (!currentAccount?.address) {
        return [];
      }

      try {
        // Step 1: Get user's MembershipNFTs
        const membershipNfts = await suiClient.getOwnedObjects({
          owner: currentAccount.address,
          filter: {
            StructType: `${COMMUNITY_PACKAGE_ID}::community::MembershipNFT`,
          },
          options: {
            showContent: true,
            showType: true,
          },
        });

        if (membershipNfts.data.length === 0) {
          return [];
        }

        // Step 2: Extract community IDs from MembershipNFTs
        const communityIds = membershipNfts.data
          .map(nft => {
            const content = nft.data?.content;
            if (content && 'fields' in content && typeof content.fields === 'object') {
              const fields = content.fields as Record<string, any>;
              return fields.community_id;
            }
            return null;
          })
          .filter((id): id is string => id !== null);

        if (communityIds.length === 0) {
          return [];
        }

        // Step 3: Fetch Community objects
        const communityObjects = await suiClient.multiGetObjects({
          ids: communityIds,
          options: {
            showContent: true,
            showType: true,
          },
        });

        // Step 4: Transform Community objects to Group interface
        const groups: Group[] = communityObjects
          .map(obj => {
            const content = obj.data?.content;
            if (!content || !('fields' in content) || typeof content.fields !== 'object') {
              return null;
            }

            const fields = content.fields as Record<string, any>;
            const entryFee = parseInt(fields.entry_fee as string);
            const isPaid = fields.is_paid as boolean;

            return {
              id: obj.data?.objectId || '',
              name: fields.name as string,
              description: fields.description as string,
              type: (isPaid ? 'paid' : 'free') as 'free' | 'paid',
              price: isPaid ? entryFee / 1_000_000_000 : undefined,
              maxMembers: parseInt(fields.max_members as string),
              currentMembers: parseInt(fields.member_count as string),
              creator: fields.owner as string,
              createdAt: new Date(parseInt(fields.created_at as string)).toISOString(),
              avatar: undefined,
            } as Group;
          })
          .filter((group): group is Group => group !== null);

        return groups;
      } catch (error) {
        console.error('Error fetching user groups:', error);
        throw new Error('Failed to fetch user groups');
      }
    },
    enabled: !!currentAccount?.address,
    staleTime: 30 * 1000, // 30 seconds
    retry: 3,
  });
}

// Hook to fetch all available communities (for discover page)
export function useAllCommunities() {
  const suiClient = useSuiClient();

  return useQuery({
    queryKey: ['all-communities'],
    queryFn: async (): Promise<Group[]> => {
      try {
        // Query all Community objects using getOwnedObjects with 0x0 (shared objects)
        const communities = await suiClient.getOwnedObjects({
          owner: '0x0', // Shared objects are owned by 0x0
          filter: {
            StructType: `${COMMUNITY_PACKAGE_ID}::community::Community`,
          },
          options: {
            showContent: true,
            showType: true,
          },
        });

        const groups: Group[] = communities.data
          .map((obj: any) => {
            const content = obj.data?.content;
            if (!content || !('fields' in content) || typeof content.fields !== 'object') {
              return null;
            }

            const fields = content.fields as Record<string, any>;
            const entryFee = parseInt(fields.entry_fee as string);
            const isPaid = fields.is_paid as boolean;

            return {
              id: obj.data?.objectId || '',
              name: fields.name as string,
              description: fields.description as string,
              type: (isPaid ? 'paid' : 'free') as 'free' | 'paid',
              price: isPaid ? entryFee / 1_000_000_000 : undefined,
              maxMembers: parseInt(fields.max_members as string),
              currentMembers: parseInt(fields.member_count as string),
              creator: fields.owner as string,
              createdAt: new Date(parseInt(fields.created_at as string)).toISOString(),
              avatar: undefined,
            } as Group;
          })
          .filter((group: any): group is Group => group !== null);

        return groups;
      } catch (error) {
        console.error('Error fetching all communities:', error);
        throw new Error('Failed to fetch communities');
      }
    },
    staleTime: 60 * 1000, // 1 minute
    retry: 3,
  });
}
