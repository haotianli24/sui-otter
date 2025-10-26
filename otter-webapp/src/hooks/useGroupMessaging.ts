import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCurrentAccount, useSuiClient, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";

const COMMUNITY_PACKAGE_ID = '0x7de4958f7ba9d65318f2ab9a08ecbc51d103f9eac9030ffca517e5b0bf5b69ed';

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

  // Fetch group chat data
  const groupChatQuery = useQuery({
    queryKey: ['group-chat', communityId],
    queryFn: async (): Promise<GroupChatData | null> => {
      if (!currentAccount?.address || !communityId) {
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

        // Step 3: Get group messages (this would need to be implemented in the smart contract)
        // For now, we'll return empty messages array
        const messages: GroupMessage[] = [];

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
        throw new Error('Failed to load group chat');
      }
    },
    enabled: !!currentAccount?.address && !!communityId,
    staleTime: 30 * 1000, // 30 seconds
    retry: 3,
  });

  return groupChatQuery;
}

export function useSendGroupMessage() {
  const currentAccount = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
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

      // Get the community object
      tx.moveCall({
        package: COMMUNITY_PACKAGE_ID,
        module: 'community',
        function: 'send_group_message',
        arguments: [
          tx.object(communityId), // Community object
          tx.object(membershipNftId), // User's membership NFT
          tx.pure.string(content), // Message content
          tx.pure.string(mediaRef), // Media reference (empty for text)
        ],
      });

      return new Promise((resolve, reject) => {
        signAndExecute(
          {
            transaction: tx,
          },
          {
            onSuccess: (result) => {
              console.log('Message sent successfully:', result);
              // Invalidate group chat query to refresh messages
              queryClient.invalidateQueries({ queryKey: ['group-chat', communityId] });
              resolve(result);
            },
            onError: (error) => {
              console.error('Failed to send message:', error);
              reject(error);
            },
          }
        );
      });
    },
  });
}

// Hook to fetch group messages (when implemented in smart contract)
export function useGroupMessages(communityId: string) {
  return useQuery({
    queryKey: ['group-messages', communityId],
    queryFn: async (): Promise<GroupMessage[]> => {
      if (!communityId) {
        return [];
      }

      try {
        // TODO: Implement message fetching from smart contract
        // This would query GroupMessage objects for the community
        // For now, return empty array
        return [];
      } catch (error) {
        console.error('Error fetching group messages:', error);
        throw new Error('Failed to fetch messages');
      }
    },
    enabled: !!communityId,
    staleTime: 10 * 1000, // 10 seconds
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  });
}
