import { useSuiClient } from "@mysten/dapp-kit";
import { useQuery } from "@tanstack/react-query";

const COMMUNITY_PACKAGE_ID = '0x7de4958f7ba9d65318f2ab9a08ecbc51d103f9eac9030ffca517e5b0bf5b69ed';

export function useCommunityRegistry() {
  const suiClient = useSuiClient();

  return useQuery({
    queryKey: ['community-registry'],
    queryFn: async () => {
      try {
        // Query for CommunityRegistry objects
        const objects = await suiClient.getOwnedObjects({
          owner: '0x0', // Shared objects are owned by 0x0
          filter: {
            StructType: `${COMMUNITY_PACKAGE_ID}::community::CommunityRegistry`,
          },
          options: {
            showContent: true,
            showType: true,
          },
        });

        if (objects.data.length === 0) {
          throw new Error('No CommunityRegistry found. The community module may not be deployed yet.');
        }

        // Return the first (and should be only) CommunityRegistry object ID
        return objects.data[0].data?.objectId;
      } catch (error) {
        console.error('Error fetching CommunityRegistry:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
  });
}

// Alternative method: Query by package and module
export async function getCommunityRegistryId(suiClient: any): Promise<string> {
  try {
    // Method 1: Query shared objects
    const sharedObjects = await suiClient.getOwnedObjects({
      owner: '0x0',
      filter: {
        StructType: `${COMMUNITY_PACKAGE_ID}::community::CommunityRegistry`,
      },
      options: {
        showContent: true,
      },
    });

    if (sharedObjects.data.length > 0) {
      return sharedObjects.data[0].data?.objectId;
    }

    // Method 2: Query all objects of this type (fallback)
    const allObjects = await suiClient.queryObjects({
      query: {
        StructType: `${COMMUNITY_PACKAGE_ID}::community::CommunityRegistry`,
      },
      options: {
        showContent: true,
      },
    });

    if (allObjects.data.length > 0) {
      return allObjects.data[0].data?.objectId;
    }

    throw new Error('CommunityRegistry not found');
  } catch (error) {
    console.error('Error getting CommunityRegistry ID:', error);
    throw error;
  }
}
