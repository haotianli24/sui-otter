import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCurrentAccount, useSuiClient, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { SuiGraphQLClient } from "@mysten/sui/graphql";
import { graphql } from "@mysten/sui/graphql/schemas/2024.4";

const COMMUNITY_PACKAGE_ID = '0xbe3df18a07f298aa3bbfb58c611595ea201fa320408fb546700d3733eae862c8';
const COMMUNITY_REGISTRY_ID = '0x7ece486d159e8b2a8d723552b218ef99a21d3555b199173d2dd49ce2d13b14eb';

export interface GroupMessage {
  id: string;
  communityId: string;
  sender: string;
  content: string;
  mediaRef: string;
  timestamp: number;
}

export interface GroupChatData {
  community: {
    id: string;
    name: string;
    description: string;
    memberCount: number;
    maxMembers: number;
    owner: string;
  };
  messages: GroupMessage[];
  membershipNftId?: string;
}

export function useGroupChat(communityId: string) {
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();

  // Debug logging
  console.log('useGroupChat called with:', { communityId, hasAccount: !!currentAccount });

  // Fetch group chat data
  const groupChatQuery = useQuery({
    queryKey: ['group-chat', communityId],
    queryFn: async (): Promise<GroupChatData | null> => {
      if (!currentAccount?.address || !communityId || communityId === '') {
        console.log('useGroupChat: Missing required data', { hasAccount: !!currentAccount, communityId });
        return null;
      }

      try {
        // Step 1: Get the Community object
        const communityObj = await suiClient.getObject({
          id: communityId,
          options: {
            showContent: true,
            showType: true,
          },
        });

        if (!communityObj.data?.content || !('fields' in communityObj.data.content)) {
          throw new Error('Community not found');
        }

        const communityFields = communityObj.data.content.fields as Record<string, any>;

        // Step 2: Get user's MembershipNFT for this community
        const membershipNfts = await suiClient.getOwnedObjects({
          owner: currentAccount.address,
          filter: {
            StructType: `${COMMUNITY_PACKAGE_ID}::community::MembershipNFT`,
          },
          options: {
            showContent: true,
          },
        });

        const userMembershipNft = membershipNfts.data.find(nft => {
          const content = nft.data?.content;
          if (content && 'fields' in content && typeof content.fields === 'object') {
            const fields = content.fields as Record<string, any>;
            return fields.community_id === communityId;
          }
          return false;
        });

        if (!userMembershipNft) {
          throw new Error('User is not a member of this community');
        }

        // Step 3: Get GroupMessage objects for this community using GraphQL
        let messages: GroupMessage[] = [];
        
        try {
          const client = new SuiGraphQLClient({ 
            url: "https://graphql.testnet.sui.io/graphql" 
          });

          const query = graphql(`
            query GetGroupMessages($type: String!) {
              objects(filter: { type: $type }, first: 50) {
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
              type: `${COMMUNITY_PACKAGE_ID}::community::GroupMessage`,
            },
          });

        if (result.data?.objects?.nodes) {
          const messageNodes = result.data.objects.nodes as any[];
          console.log('GraphQL returned message nodes:', messageNodes.length);
          
          // Filter messages that belong to this community
          messages = messageNodes
            .map((node) => {
              const fields = node.asMoveObject?.contents?.json;
              if (!fields || typeof fields !== 'object') {
                return null;
              }

              console.log('Message fields:', fields, 'community_id:', fields.community_id, 'matches:', fields.community_id === communityId);

              // Check if this message belongs to our community
              if (fields.community_id === communityId) {
                // timestamp is epoch number from smart contract
                // Store as epoch number for stable timestamp
                const epoch = parseInt(fields.timestamp as string);
                return {
                  id: node.address || '',
                  communityId,
                  sender: fields.sender as string,
                  content: fields.content as string,
                  mediaRef: fields.media_ref as string,
                  timestamp: epoch, // Store epoch number directly
                } as GroupMessage;
              }
              return null;
            })
            .filter((msg): msg is GroupMessage => msg !== null);
          
          console.log('Filtered messages count:', messages.length);
          
          // Sort by timestamp (most recent first) - now with proper Clock timestamps
          messages.sort((a, b) => b.timestamp - a.timestamp);
          
          // Debug: Log sorted messages with readable timestamps
          console.log('[useGroupChat] Messages sorted by timestamp:', messages.map(m => ({
            id: m.id.substring(0, 8),
            sender: m.sender.substring(0, 8),
            timestamp: m.timestamp,
            readableTime: new Date(m.timestamp).toISOString(),
            content: m.content.substring(0, 20) + '...'
          })));
          }
        } catch (error) {
          console.error('Error fetching group messages:', error);
          // Continue with empty messages array
        }

        return {
          community: {
            id: communityId,
            name: communityFields.name as string,
            description: communityFields.description as string,
            memberCount: parseInt(communityFields.member_count as string),
            maxMembers: parseInt(communityFields.max_members as string),
            owner: communityFields.owner as string,
          },
          messages,
          membershipNftId: userMembershipNft.data?.objectId,
        };
      } catch (error) {
        console.error('Error fetching group chat data:', error);
        // Return null instead of throwing to prevent crashes
        return null;
      }
    },
    enabled: !!currentAccount?.address && !!communityId && communityId !== '',
    staleTime: 5 * 1000, // Consider data stale after 5 seconds
    refetchInterval: 10 * 1000, // Poll every 10 seconds for group updates
    refetchIntervalInBackground: true, // Continue polling when tab is not active
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    retry: 3,
  });

  return groupChatQuery;
}

export function useSendGroupMessage() {
  const currentAccount = useCurrentAccount();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      communityId,
      membershipNftId,
      content,
      mediaRef = '',
    }: {
      communityId: string;
      membershipNftId: string;
      content: string;
      mediaRef?: string;
    }) => {
      if (!currentAccount) {
        throw new Error('Wallet not connected');
      }

      const tx = new Transaction();

      // Call the send_group_message function from the smart contract with Clock
      tx.moveCall({
        package: COMMUNITY_PACKAGE_ID,
        module: 'community',
        function: 'send_group_message',
        arguments: [
          tx.object(communityId), // Community object
          tx.object(membershipNftId), // User's membership NFT
          tx.pure.string(content), // Message content
          tx.pure.string(mediaRef), // Media reference (empty for text)
          tx.object('0x6'), // Sui Clock object at well-known address
        ],
      });

      const result = await signAndExecute({ transaction: tx });
      const digest = result.digest;

      console.log('[useSendGroupMessage] Message sent successfully:', { digest, communityId, content });

      // Invalidate group chat query to refresh messages
      queryClient.invalidateQueries({ queryKey: ['group-chat', communityId] });
      queryClient.invalidateQueries({ queryKey: ['group-messages', communityId] });

      return { digest };
    },
  });
}

// Hook to fetch group messages using GraphQL
export function useGroupMessages(communityId: string) {
  return useQuery({
    queryKey: ['group-messages', communityId],
    queryFn: async (): Promise<GroupMessage[]> => {
      if (!communityId) {
        return [];
      }

      try {
        // Try GraphQL first
        try {
          const client = new SuiGraphQLClient({ 
            url: "https://graphql.testnet.sui.io/graphql" 
          });

          const query = graphql(`
            query GetGroupMessages($type: String!) {
              objects(filter: { type: $type }, first: 50) {
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
              type: `${COMMUNITY_PACKAGE_ID}::community::GroupMessage`,
            },
          });

          console.log('[useGroupMessages] GraphQL result:', result);
          console.log('[useGroupMessages] Querying for type:', `${COMMUNITY_PACKAGE_ID}::community::GroupMessage`);
          
          // Log errors if they exist
          if (result.errors && result.errors.length > 0) {
            console.error('[useGroupMessages] GraphQL errors:', result.errors);
            console.error('[useGroupMessages] First error details:', result.errors[0]);
          }

          if (result.data?.objects?.nodes) {
            const messageNodes = result.data.objects.nodes as any[];
            console.log('[useGroupMessages] GraphQL returned message nodes:', messageNodes.length);
            
            // Filter messages that belong to this community
            const messages = messageNodes
              .map((node) => {
                const fields = node.asMoveObject?.contents?.json;
                if (!fields || typeof fields !== 'object') {
                  return null;
                }

                console.log('[useGroupMessages] Checking message:', {
                  messageFields: fields,
                  community_id: fields.community_id,
                  targetCommunityId: communityId,
                  matches: fields.community_id === communityId
                });

              // Check if this message belongs to our community
              if (fields.community_id === communityId) {
                // timestamp is now millisecond precision from Sui Clock
                // Store as timestamp for proper chronological ordering
                const rawTimestamp = fields.timestamp as string;
                const timestamp = parseInt(rawTimestamp);
                
                console.log('[useGroupMessages] Parsing timestamp:', {
                  rawTimestamp,
                  parsedTimestamp: timestamp,
                  isValid: !isNaN(timestamp),
                  readableTime: new Date(timestamp).toISOString(),
                  sender: fields.sender,
                  content: fields.content.substring(0, 20) + '...'
                });
                
                return {
                  id: node.address || '',
                  communityId,
                  sender: fields.sender as string,
                  content: fields.content as string,
                  mediaRef: fields.media_ref as string,
                  timestamp: timestamp, // Store millisecond timestamp directly
                } as GroupMessage;
              }
                return null;
              })
              .filter((msg): msg is GroupMessage => msg !== null);

            console.log('[useGroupMessages] Filtered messages count:', messages.length);
            
            // Sort by timestamp (most recent first) - now with proper Clock timestamps
            messages.sort((a, b) => a.timestamp - b.timestamp);
            
            // Debug: Log sorted messages with readable timestamps
            console.log('[useGroupMessages] Messages sorted by timestamp:', messages.map(m => ({
              id: m.id.substring(0, 8),
              sender: m.sender.substring(0, 8),
              timestamp: m.timestamp,
              readableTime: new Date(m.timestamp).toISOString(),
              content: m.content.substring(0, 20) + '...'
            })));
            
            return messages;
          }

          console.log('[useGroupMessages] No message nodes found via GraphQL');
        } catch (graphqlError) {
          console.error('[useGroupMessages] GraphQL failed, trying RPC fallback:', graphqlError);
        }

        // Fallback: Try to get all objects and filter manually
        // This is a workaround since GraphQL might not be working properly
        console.log('[useGroupMessages] Trying RPC fallback...');
        
        // For now, return empty array since we can't easily query shared objects via RPC
        // In a real implementation, you'd need to track message IDs or use events
        console.log('[useGroupMessages] RPC fallback not implemented yet');
        return [];
        
      } catch (error) {
        console.error('Error fetching group messages:', error);
        return [];
      }
    },
    enabled: !!communityId,
    staleTime: 2 * 1000, // Consider data stale after 2 seconds
    refetchInterval: 5 * 1000, // Poll every 5 seconds for new messages
    refetchIntervalInBackground: true, // Continue polling when tab is not active
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    refetchOnMount: true, // Always refetch when component mounts
  });
}