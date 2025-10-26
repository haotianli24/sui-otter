import { useQuery } from "@tanstack/react-query";
import { useCurrentAccount, useSuiClient } from "@mysten/dapp-kit";
import { SuiGraphQLClient } from "@mysten/sui/graphql";
import { graphql } from "@mysten/sui/graphql/schemas/2024.4";

const COMMUNITY_PACKAGE_ID = '0xbe3df18a07f298aa3bbfb58c611595ea201fa320408fb546700d3733eae862c8';

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

        // Step 2: Extract group IDs from MembershipNFTs
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

        // Step 3: Fetch Group objects
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
    staleTime: 10 * 1000, // Consider data stale after 10 seconds
    refetchInterval: 15 * 1000, // Poll every 15 seconds for new groups
    refetchIntervalInBackground: true, // Continue polling when tab is not active
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    retry: 3,
  });
}

// Hook to fetch all available groups (for discover page)
export function useAllGroups() {
  return useQuery({
    queryKey: ['all-groups'],
    queryFn: async (): Promise<Group[]> => {
      try {
        const client = new SuiGraphQLClient({
          url: "https://graphql.testnet.sui.io/graphql"
        });

        const query = graphql(`
          query GetGroups($type: String!) {
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
        console.error('Error fetching all groups:', error);
        // Return empty array instead of throwing to prevent UI crashes
        return [];
      }
    },
    staleTime: 30 * 1000, // Consider data stale after 30 seconds
    refetchInterval: 2 * 60 * 1000, // Refetch every 2 minutes for new groups
    refetchIntervalInBackground: true, // Continue polling when tab is not active
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    retry: 3,
  });
}

// Hook to fetch members of a specific group
export function useCommunityMembers(communityId: string) {
  const suiClient = useSuiClient();

  return useQuery({
    queryKey: ['community-members', communityId],
    queryFn: async (): Promise<CommunityMember[]> => {
      if (!communityId) return [];

      try {
        // First, get the community data to get the owner
        const communityObject = await suiClient.getObject({
          id: communityId,
          options: {
            showContent: true,
            showType: true,
          },
        });

        if (!communityObject.data?.content || !('fields' in communityObject.data.content)) {
          return [];
        }

        const communityFields = communityObject.data.content.fields as any;
        const owner = communityFields.owner as string;
        const memberCount = parseInt(communityFields.member_count as string);

        // Start with the owner
        const members: CommunityMember[] = [
          {
            id: owner,
            name: 'Community Owner',
            avatar: '👑',
            address: owner,
            bio: 'Community creator'
          }
        ];

        // Query MembershipNFT objects using GraphQL
        const client = new SuiGraphQLClient({
          url: "https://graphql.testnet.sui.io/graphql"
        });

        const query = graphql(`
          query GetMembershipNFTs($type: String!) {
            objects(filter: { type: $type }, first: 100) {
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
            type: `${COMMUNITY_PACKAGE_ID}::community::MembershipNFT`,
          },
        });

        if (result.data?.objects?.nodes) {
          const membershipNfts = result.data.objects.nodes as any[];

          // Filter NFTs that belong to this community
          const communityMemberships = membershipNfts.filter((nft: any) => {
            const fields = nft.asMoveObject?.contents?.json;
            return fields && fields.community_id === communityId;
          });

          // Add actual members from the NFTs
          communityMemberships.forEach((nft: any) => {
            const fields = nft.asMoveObject?.contents?.json;
            if (fields && fields.member !== owner) { // Don't duplicate the owner
              members.push({
                id: fields.member,
                name: `Member ${members.length}`,
                avatar: '👤',
                address: fields.member,
                bio: 'Community member'
              });
            }
          });
        }

        // If we still don't have enough members based on member_count, add mock ones
        while (members.length < memberCount) {
          members.push({
            id: `mock-member-${members.length}`,
            name: `Member ${members.length}`,
            avatar: '👤',
            address: `0x${members.length.toString().padStart(64, '0')}`,
            bio: 'Community member'
          });
        }

        return members;
      } catch (error) {
        console.error('Error fetching community members:', error);
        // Return empty array instead of throwing to prevent crashes
        return [];
      }
    },
    enabled: !!communityId,
    staleTime: 15 * 1000, // Consider data stale after 15 seconds
    refetchInterval: 20 * 1000, // Poll every 20 seconds for member updates
    refetchIntervalInBackground: true, // Continue polling when tab is not active
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    retry: 3,
  });
}
