import { NextResponse } from 'next/server';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';

const client = new SuiClient({ url: getFullnodeUrl('mainnet') });

export async function GET() {
    try {
        const txs = await client.queryTransactionBlocks({
            limit: 10,
            options: {
                showInput: true,
                showEffects: true,
            },
        });

        return NextResponse.json(txs.data);
    } catch (error) {
        console.error('Error fetching recent transactions:', error);
        return NextResponse.json(
            { error: 'Failed to fetch recent transactions' },
            { status: 500 }
        );
    }
}
