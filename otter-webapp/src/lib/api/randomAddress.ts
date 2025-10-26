import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";

// Create a single client instance
const client = new SuiClient({ url: getFullnodeUrl("mainnet") });

// Helper function to validate Sui address
function isValidSuiAddress(address: string): boolean {
    if (!address) return false;

    // Check if it's all zeros (invalid)
    if (address.match(/^0x0+$/)) return false;

    // Basic Sui address validation
    return address.startsWith('0x') && address.length === 66;
}

export async function getRandomAddress(): Promise<{ address: string; digest?: string; timestamp?: string } | null> {
    try {
        // Fetch recent transactions to get a random address
        const recentTxs = await client.queryTransactionBlocks({
            options: {
                showInput: true,
                showEffects: true,
                showEvents: true,
                showObjectChanges: true,
                showBalanceChanges: true,
            },
            limit: 50, // Get more transactions to find valid ones
            order: 'descending',
        });

        if (recentTxs.data.length === 0) {
            throw new Error("No recent transactions found");
        }

        // Filter for transactions with valid sender addresses
        const validTxs = recentTxs.data.filter(tx => {
            const senderAddress = tx.transaction?.data?.sender;
            return senderAddress && isValidSuiAddress(senderAddress);
        });

        if (validTxs.length === 0) {
            throw new Error("No valid addresses found");
        }

        // Pick a random transaction from valid ones
        const randomTx = validTxs[Math.floor(Math.random() * validTxs.length)];
        const senderAddress = randomTx.transaction?.data?.sender;

        return {
            address: senderAddress || '',
            digest: randomTx.digest,
            timestamp: randomTx.timestampMs || new Date().toISOString()
        };
    } catch (error) {
        console.error("Error fetching random address:", error);
        return null;
    }
}
