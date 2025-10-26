import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';

const client = new SuiClient({ url: getFullnodeUrl('testnet') });

export async function getRecentTransactions(limit: number = 10) {
    try {
        const txs = await client.queryTransactionBlocks({
            limit,
            options: {
                showInput: true,
                showEffects: true,
            },
        });

        return txs.data;
    } catch (error) {
        console.error('Error fetching recent transactions:', error);
        return null;
    }
}
