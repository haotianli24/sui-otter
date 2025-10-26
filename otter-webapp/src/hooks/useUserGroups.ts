import { useQuery } from "@tanstack/react-query";
import { useCurrentAccount, useSuiClient } from "@mysten/dapp-kit";
import { SuiGraphQLClient } from "@mysten/sui/graphql";
import { graphql } from "@mysten/sui/graphql/schemas/2024.4";

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

export interface CommunityMember {
  id: string;
  name: string;
  avatar: string;
  address: string;
  bio?: string;
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
  return useQuery({
    queryKey: ['all-communities'],
    queryFn: async (): Promise<Group[]> => {
      try {
        const client = new SuiGraphQLClient({ 
          url: "https://graphql.testnet.sui.io/graphql" 
        });

        const query = graphql(`
          query GetCommunities($type: String!) {
            objects(filter: { type: $type }, first: 50) {
              pageInfo {
                hasNextPage
                startCursor
                endCursor
              }
              nodes {
                address
                asMoveObject {
                  contents {
                    json
                  }
                }
              }
            }
          }
        `);

        const result = await client.query({
          query,
          variables: {
            type: `${COMMUNITY_PACKAGE_ID}::community::Community`,
          },
        });

        if (result.data?.objects) {
          const nodes = result.data.objects.nodes as any[];
          
          const groups: Group[] = nodes
            .map((node) => {
              const fields = node.asMoveObject?.contents?.json;
              if (!fields || typeof fields !== 'object') {
                return null;
              }

              const entryFee = parseInt(fields.entry_fee as string);
              const isPaid = fields.is_paid as boolean;

              return {
                id: node.address || '',
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
        }

        return [];
      } catch (error) {
        console.error('Error fetching all communities:', error);
        // Return empty array instead of throwing to prevent UI crashes
        return [];
      }
    },
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    retry: 3,
  });
}

// Hook to fetch members of a specific community
export function useCommunityMembers(communityId: string) {

  return useQuery({
    queryKey: ['community-members', communityId],
    queryFn: async (): Promise<CommunityMember[]> => {
      if (!communityId) return [];

      try {
        const client = new SuiGraphQLClient({ 
          url: "https://graphql.testnet.sui.io/graphql" 
        });

        const query = graphql(`
          query GetCommunityMembers($type: String!, $communityId: String!) {
            objects(filter: { 
              type: $type,
              objectIds: [$communityId]
            }, first: 1) {
              nodes {
                address
                asMoveObject {
                  contents {
                    json
                  }
                }
              }
            }
          }
        `);

        const result = await client.query({
          query,
          variables: {
            type: `${COMMUNITY_PACKAGE_ID}::community::Community`,
            communityId: communityId,
          },
        });

        if (result.data?.objects?.nodes?.[0]) {
          const communityData = result.data.objects.nodes[0].asMoveObject?.contents?.json as any;
          if (communityData) {
            // For now, return mock members since we need to implement proper member tracking
            // In a real implementation, you'd query MembershipNFT objects and get member addresses
            const mockMembers: CommunityMember[] = [
              {
                id: communityData.owner || '1',
                name: 'Community Owner',
                avatar: '👑',
                address: communityData.owner || '',
                bio: 'Community creator'
              }
            ];

            // Add some mock members for demonstration
            if (parseInt(communityData.member_count) > 1) {
              for (let i = 2; i <= Math.min(parseInt(communityData.member_count), 5); i++) {
                mockMembers.push({
                  id: `member-${i}`,
                  name: `Member ${i}`,
                  avatar: '👤',
                  address: `0x${i.toString().padStart(64, '0')}`,
                  bio: 'Community member'
                });
              }
            }

            return mockMembers;
          }
        }

        return [];
      } catch (error) {
        console.error('Error fetching community members:', error);
        return [];
      }
    },
    enabled: !!communityId,
    staleTime: 30 * 1000, // 30 seconds
    retry: 3,
  });
}
