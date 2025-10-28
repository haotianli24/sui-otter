import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";

// Create a single client instance
const client = new SuiClient({ url: getFullnodeUrl("testnet") });

export interface ActivityItem {
    digest: string;
    timestamp: string;
    sender: string;
    type: 'incoming' | 'outgoing';
    gasUsed: string;
    operationsCount: number;
    participants: string[];
}

export interface AddressActivityResponse {
    activities: ActivityItem[];
    hasMore: boolean;
    nextCursor?: string;
    totalCount: number;
}

export async function getAddressActivity(
    address: string,
    limit: number = 50,
    cursor?: string
): Promise<AddressActivityResponse | null> {
    try {
        if (!address) {
            throw new Error("Address is required");
        }

        // Validate address format (basic check)
        if (!address.startsWith('0x') || address.length !== 66) {
            throw new Error("Invalid address format");
        }

        // Query transactions where the address is either sender or recipient
        const [outgoingTxs, incomingTxs] = await Promise.all([
            // Outgoing transactions (address is sender)
            client.queryTransactionBlocks({
                filter: { FromAddress: address },
                options: {
                    showInput: true,
                    showEffects: true,
                    showEvents: true,
                    showObjectChanges: true,
                    showBalanceChanges: true,
                },
                limit: Math.ceil(limit / 2), // Split limit between incoming and outgoing
                order: 'descending',
                cursor: cursor,
            }),
            // Incoming transactions (address is recipient)
            client.queryTransactionBlocks({
                filter: { ToAddress: address },
                options: {
                    showInput: true,
                    showEffects: true,
                    showEvents: true,
                    showObjectChanges: true,
                    showBalanceChanges: true,
                },
                limit: Math.ceil(limit / 2),
                order: 'descending',
                cursor: cursor,
            })
        ]);

        // Combine and sort transactions by timestamp
        const allTxs = [
            ...outgoingTxs.data.map(tx => ({ ...tx, type: 'outgoing' as const })),
            ...incomingTxs.data.map(tx => ({ ...tx, type: 'incoming' as const }))
        ].sort((a, b) => {
            const timestampA = new Date(a.timestampMs || 0).getTime();
            const timestampB = new Date(b.timestampMs || 0).getTime();
            return timestampB - timestampA; // Most recent first
        }).slice(0, limit);

        // Transform to ActivityItem format
        const activities: ActivityItem[] = allTxs.map(tx => {
            const gasUsed = tx.effects?.gasUsed
                ? (Number(tx.effects.gasUsed.computationCost) + Number(tx.effects.gasUsed.storageCost) - Number(tx.effects.gasUsed.storageRebate)) / 1e9
                : 0;

            // Extract participants
            const participants = new Set<string>();
            if (tx.transaction?.data?.sender) {
                participants.add(tx.transaction.data.sender);
            }

            // Add participants from object changes
            if (tx.objectChanges) {
                tx.objectChanges.forEach((change: any) => {
                    if (change.owner?.AddressOwner) {
                        participants.add(change.owner.AddressOwner);
                    }
                });
            }

            return {
                digest: tx.digest,
                timestamp: tx.timestampMs || new Date().toISOString(),
                sender: tx.transaction?.data?.sender || '',
                type: tx.type,
                gasUsed: gasUsed.toFixed(6),
                operationsCount: tx.objectChanges?.length || 0,
                participants: Array.from(participants)
            };
        });

        // Determine if there are more results
        const hasMore = allTxs.length === limit;
        const nextCursor = hasMore ? allTxs[allTxs.length - 1]?.digest : undefined;

        const response: AddressActivityResponse = {
            activities,
            hasMore,
            nextCursor,
            totalCount: activities.length
        };

        return response;
    } catch (error) {
        console.error("Error fetching address activity:", error);
        return null;
    }
}
