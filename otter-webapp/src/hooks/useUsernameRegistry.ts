import { useCurrentAccount, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SuiGraphQLClient } from "@mysten/sui/graphql";
import { graphql } from "@mysten/sui/graphql/schemas/2024.4";

// Username Registry Package ID and Object ID
const USERNAME_REGISTRY_PACKAGE_ID = '0xf280398432bee996bb8ddf1fc62a6c1dfa43204884c4270a1eb2ac4687513f0f';
const USERNAME_REGISTRY_ID = '0x6a86721f5ae985fe161821bd7deef58bd50c4ba92d5b18e87f3b0626e622a817';

export interface OnChainUserProfile {
  id: string;
  user: string;
  username: string;
  bio: string;
  avatarUrl: string;
  website: string;
  createdAt: number;
  updatedAt: number;
}

// Hook to get username for any address
export function useUsername(address: string) {
  return useQuery({
    queryKey: ['username', address],
    queryFn: async (): Promise<string | null> => {
      if (!address) return null;

      try {
        // Query for UserProfile objects owned by the address
        const client = new SuiGraphQLClient({ 
          url: "https://graphql.testnet.sui.io/graphql" 
        });

        const query = graphql(`
          query GetUsername($owner: String!) {
            objects(
              filter: { 
                owner: $owner
                type: "${USERNAME_REGISTRY_PACKAGE_ID}::usernameregistry::UserProfile"
              }
            ) {
              nodes {
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
            owner: address,
          },
        });

        if (result.data?.objects?.nodes && result.data.objects.nodes.length > 0) {
          const profileData = result.data.objects.nodes[0].asMoveObject?.contents?.json as any;
          if (profileData?.username) {
            return profileData.username;
          }
        }

        return null;
      } catch (error) {
        console.error('Error fetching username:', error);
        return null;
      }
    },
    enabled: !!address,
    staleTime: 30 * 1000, // 30 seconds
  });
}

// Hook to get user profile from on-chain
export function useUserProfile(address: string) {

  return useQuery({
    queryKey: ['user-profile', address],
    queryFn: async (): Promise<OnChainUserProfile | null> => {
      if (!address) return null;

      try {
        // Query for UserProfile objects owned by the address
        const client = new SuiGraphQLClient({ 
          url: "https://graphql.testnet.sui.io/graphql" 
        });

        const query = graphql(`
          query GetUserProfile($owner: String!) {
            objects(filter: { owner: $owner, type: "${USERNAME_REGISTRY_PACKAGE_ID}::usernameregistry::UserProfile" }) {
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
            owner: address,
          },
        });

        if (result.data?.objects?.nodes && result.data.objects.nodes.length > 0) {
          const profileData = result.data.objects.nodes[0].asMoveObject?.contents?.json as any;
          if (profileData) {
            return {
              id: result.data.objects.nodes[0].address,
              user: profileData.user,
              username: profileData.username,
              bio: profileData.bio,
              avatarUrl: profileData.avatar_url,
              website: profileData.website,
              createdAt: parseInt(profileData.created_at),
              updatedAt: parseInt(profileData.updated_at),
            };
          }
        }

        return null;
      } catch (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }
    },
    enabled: !!address,
    staleTime: 30 * 1000, // 30 seconds
  });
}

// Hook to set username on-chain
export function useSetUsername() {
  const currentAccount = useCurrentAccount();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ username, bio = '', avatarUrl = '', website = '' }: {
      username: string;
      bio?: string;
      avatarUrl?: string;
      website?: string;
    }) => {
      if (!currentAccount?.address) {
        throw new Error('No wallet connected');
      }

      const tx = new Transaction();
      
      // Use set_username_with_profile to register the username and create profile
      tx.moveCall({
        package: USERNAME_REGISTRY_PACKAGE_ID,
        module: 'usernameregistry',
        function: 'set_username_with_profile',
        arguments: [
          tx.object(USERNAME_REGISTRY_ID),
          tx.pure.string(username),
          tx.pure.string(bio),
          tx.pure.string(avatarUrl),
          tx.pure.string(website),
        ],
      });

      const result = await signAndExecute({
        transaction: tx,
      });

      // Wait a moment for the transaction to be processed
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['username', currentAccount.address] });
      queryClient.invalidateQueries({ queryKey: ['user-profile', currentAccount.address] });

      return result;
    },
  });
}

// Hook to check if username is available
export function useCheckUsernameAvailability(username: string) {
  return useQuery({
    queryKey: ['username-availability', username],
    queryFn: async (): Promise<boolean> => {
      if (!username.trim()) return false;

      try {
        // Query the registry's shared object to check username availability
        const client = new SuiGraphQLClient({ 
          url: "https://graphql.testnet.sui.io/graphql" 
        });

        // First, check if there are any UserProfile objects with this username
        const profileQuery = graphql(`
          query CheckUsernameInProfiles {
            objects(
              filter: { 
                type: "${USERNAME_REGISTRY_PACKAGE_ID}::usernameregistry::UserProfile"
              }
            ) {
              nodes {
                asMoveObject {
                  contents {
                    json
                  }
                }
              }
            }
          }
        `);

        const profileResult = await client.query({
          query: profileQuery,
        });

        if (profileResult.data?.objects?.nodes) {
          // Check if any profile has this username
          for (const node of profileResult.data.objects.nodes) {
            const profileData = node.asMoveObject?.contents?.json as any;
            if (profileData?.username === username) {
              return false; // Username is taken
            }
          }
        }

        // Also check the registry's taken_usernames set by looking at events
        const eventQuery = graphql(`
          query CheckUsernameEvents {
            events(
              filter: { 
                type: "${USERNAME_REGISTRY_PACKAGE_ID}::usernameregistry::UsernameSet"
              }
              order: DESC
            ) {
              nodes {
                bcs
                timestamp
              }
            }
          }
        `);

        await client.query({
          query: eventQuery,
        });

        // For now, assume username is available if we can't find it in profiles
        // The event BCS decoding would be needed for a complete check
        return true;
      } catch (error) {
        console.error('Error checking username availability:', error);
        return false;
      }
    },
    enabled: !!username.trim(),
    staleTime: 30 * 1000, // 30 seconds
  });
}

// Enhanced helper function that checks both on-chain and local storage
export function getDisplayName(address: string): string {
  if (!address) return "Unknown User";
  
  // First try to get from localStorage (for immediate updates)
  try {
    const storedProfiles = localStorage.getItem('otter_user_profiles');
    const profiles: Record<string, any> = storedProfiles ? JSON.parse(storedProfiles) : {};
    const userProfile = profiles[address];
    if (userProfile?.displayName) {
      return userProfile.displayName;
    }
  } catch (error) {
    console.error('Error getting display name from localStorage:', error);
  }

  // Fallback to address-based name with better formatting
  return `User ${address.slice(0, 8)}`;
}

// Enhanced helper function that gets username (for @mentions, etc.)
export function getUsername(address: string): string {
  // First try to get from localStorage
  try {
    const storedProfiles = localStorage.getItem('otter_user_profiles');
    const profiles: Record<string, any> = storedProfiles ? JSON.parse(storedProfiles) : {};
    const userProfile = profiles[address];
    if (userProfile?.username) {
      return userProfile.username;
    }
  } catch (error) {
    console.error('Error getting username from localStorage:', error);
  }

  // TODO: In production, this would also check on-chain data
  // For now, fallback to address-based username
  return `user_${address.slice(0, 8)}`;
}
