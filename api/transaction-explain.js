// Vercel Serverless Function for Transaction Explanation
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Protocol registry
const KNOWN_PROTOCOLS = {
    "0x1eabed72c53feb3805120a081dc15963c204dc8d091542592abaf7a35689b2fb": { name: "Cetus" },
    "0x91bfbc386a41afcfd9b2533058d7e915a1d3829089cc268ff4333d54d6339ca1": { name: "Turbos" },
    "0x5d1b99f4d45f1440f2fd6f535c2aee8e550eaea7af877cafe8d456cdf4c4b8d": { name: "Kriya" },
    "0x2": { name: "Sui Framework" },
};

const KNOWN_TOKENS = {
    "0x2::sui::SUI": "SUI",
    "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC": "USDC",
    "0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN": "WETH",
    "0xaf8cd5edc19c4512f4259f0bee101a40d41ebd73820c7a13f434611c87e57ad6::coin::COIN": "USDT",
};

function resolveProtocolName(packageId) {
    const proto = KNOWN_PROTOCOLS[packageId];
    return proto?.name || 'Unknown Protocol';
}

function extractTokenSymbol(typeStr) {
    if (!typeStr) return 'Unknown';
    if (KNOWN_TOKENS[typeStr]) return KNOWN_TOKENS[typeStr];
    const parts = String(typeStr).split('::');
    const lastPart = parts[parts.length - 1];
    if (['SUI', 'USDC', 'USDT', 'WETH'].includes(lastPart)) return lastPart;
    return lastPart || 'Token';
}

function formatAddress(address) {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function parseObjectType(objectType) {
    if (!objectType) {
        return { packageId: '', module: '', typeName: '', typeParams: [], protocolName: 'Unknown' };
    }

    const parts = objectType.split('::');
    const packageId = parts[0] || '';
    const module = parts[1] || '';
    const typeName = parts[2] ? parts[2].split('<')[0] : '';

    const typeParamMatch = objectType.match(/<([^>]+)>/);
    const typeParams = typeParamMatch ? typeParamMatch[1].split(',').map((p) => p.trim()) : [];

    const protocolName = resolveProtocolName(packageId);

    return { packageId, module, typeName, typeParams, protocolName };
}

function formatObjectDescription(change, sender, type) {
    const { packageId, module, typeName, typeParams, protocolName } = parseObjectType(change.objectType);

    if (typeName === 'Pool' && typeParams.length >= 2) {
        const token1 = extractTokenSymbol(typeParams[0]);
        const token2 = extractTokenSymbol(typeParams[1]);
        return type === 'created' 
            ? `Created ${protocolName} liquidity pool (${token1}/${token2})`
            : `Updated ${protocolName} pool (${token1}/${token2})`;
    }

    if (typeName === 'Position') {
        return type === 'created' 
            ? `Opened position in ${protocolName}`
            : `Modified ${protocolName} position`;
    }

    if (typeName === 'Coin') {
        const tokenSymbol = extractTokenSymbol(change.objectType);
        return type === 'created' 
            ? `Minted ${tokenSymbol} tokens`
            : `Updated ${tokenSymbol} balance`;
    }

    if (protocolName !== 'Unknown Protocol') {
        return type === 'created' 
            ? `Created ${protocolName} ${module} object`
            : `Updated ${protocolName} ${module}`;
    }

    return type === 'created' ? `Created new object` : `Updated object`;
}

function parseTransactionChanges(txData) {
    const operations = [];
    const sender = txData.transaction?.data?.sender;

    if (txData.objectChanges) {
        txData.objectChanges.forEach(change => {
            const objectId = change.objectId;
            const objectType = change.objectType;
            const owner = change.owner?.AddressOwner || change.owner?.Shared || change.owner?.Immutable;

            switch (change.type) {
                case 'created':
                    operations.push({
                        type: 'create',
                        objectId,
                        objectType,
                        description: formatObjectDescription(change, sender, 'created'),
                        to: owner,
                    });
                    break;
                case 'mutated':
                    operations.push({
                        type: 'mutate',
                        objectId,
                        objectType,
                        description: formatObjectDescription(change, sender, 'mutated'),
                        to: owner,
                    });
                    break;
                case 'transferred':
                    const fromAddress = change.sender || sender;
                    const toAddress = change.owner?.AddressOwner;
                    operations.push({
                        type: 'transfer',
                        from: fromAddress,
                        to: toAddress,
                        objectId,
                        objectType,
                        description: `Object transferred from ${formatAddress(fromAddress)} to ${formatAddress(toAddress)}`,
                    });
                    break;
                case 'deleted':
                    operations.push({
                        type: 'delete',
                        objectId,
                        objectType,
                        description: `Object deleted`,
                    });
                    break;
                case 'published':
                    operations.push({
                        type: 'publish',
                        objectId: change.packageId,
                        description: `New smart contract published`,
                    });
                    break;
            }
        });
    }

    if (txData.balanceChanges) {
        txData.balanceChanges.forEach(balanceChange => {
            const amount = Math.abs(Number(balanceChange.amount)) / 1e9;
            const isIncrease = Number(balanceChange.amount) > 0;
            const owner = balanceChange.owner?.AddressOwner;

            operations.push({
                type: 'transfer',
                from: isIncrease ? undefined : owner,
                to: isIncrease ? owner : undefined,
                amount: amount.toFixed(6),
                asset: 'SUI',
                description: isIncrease
                    ? `${formatAddress(owner)} received ${amount.toFixed(6)} SUI`
                    : `${formatAddress(owner)} sent ${amount.toFixed(6)} SUI`,
            });
        });
    }

    if (txData.effects?.gasUsed) {
        const gasUsed = (Number(txData.effects.gasUsed.computationCost) + Number(txData.effects.gasUsed.storageCost) - Number(txData.effects.gasUsed.storageRebate)) / 1e9;
        operations.push({
            type: 'transfer',
            from: sender,
            description: `Gas fee: ${gasUsed.toFixed(6)} SUI`,
            asset: 'SUI',
            amount: gasUsed.toFixed(6),
        });
    }

    return operations;
}

function extractMoveCalls(txData) {
    const moveCalls = [];

    if (txData.transaction?.data?.transactions) {
        txData.transaction.data.transactions.forEach(tx => {
            if (tx.MoveCall) {
                moveCalls.push({
                    package: tx.MoveCall.package,
                    module: tx.MoveCall.module,
                    function: tx.MoveCall.function,
                    arguments: tx.MoveCall.arguments || [],
                });
            }
        });
    }

    return moveCalls;
}

function extractParticipants(txData, effects) {
    const participants = new Set();

    if (txData.transaction?.data?.sender) {
        participants.add(txData.transaction.data.sender);
    }

    if (txData.transaction?.data?.transactions) {
        txData.transaction.data.transactions.forEach(tx => {
            if (tx.TransferObjects?.recipient) {
                participants.add(tx.TransferObjects.recipient);
            }
        });
    }

    if (effects?.created) {
        effects.created.forEach(obj => {
            if (obj.owner?.AddressOwner) {
                participants.add(obj.owner.AddressOwner);
            }
        });
    }

    if (effects?.mutated) {
        effects.mutated.forEach(obj => {
            if (obj.owner?.AddressOwner) {
                participants.add(obj.owner.AddressOwner);
            }
        });
    }

    return Array.from(participants);
}

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { digest, context } = req.body;

        if (!digest) {
            return res.status(400).json({ error: 'Transaction digest is required' });
        }

        // Initialize Sui client
        const client = new SuiClient({ url: getFullnodeUrl('testnet') });

        // Fetch transaction data
        console.log('Fetching transaction:', digest);
        const txData = await client.getTransactionBlock({
            digest,
            options: {
                showInput: true,
                showEffects: true,
                showEvents: true,
                showObjectChanges: true,
                showBalanceChanges: true,
            },
        });

        if (!txData) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        // Parse transaction data
        const operations = parseTransactionChanges(txData);
        const moveCalls = extractMoveCalls(txData);
        const participants = extractParticipants(txData, txData.effects);
        
        const gasUsed = txData.effects?.gasUsed
            ? (Number(txData.effects.gasUsed.computationCost) || 0) + 
              (Number(txData.effects.gasUsed.storageCost) || 0) - 
              (Number(txData.effects.gasUsed.storageRebate) || 0)
            : 0;

        const sender = txData.transaction?.data?.sender;
        const protocolName = moveCalls.length > 0 ? resolveProtocolName(moveCalls[0].package) : undefined;

        // Check for Gemini API key
        const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
        
        if (!apiKey) {
            console.log('No Gemini API key configured, using simple explanation');
            return res.status(200).json({
                explanation: generateSimpleExplanation({ 
                    digest, 
                    gasUsed, 
                    operations, 
                    moveCalls, 
                    participants,
                    protocolName 
                }, context),
                digest,
                cached: false,
                timestamp: new Date().toISOString(),
            });
        }

        // Call Gemini API
        console.log('Calling Gemini API...');
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        // Build context for the prompt
        let pronounContext = "";
        let contextInfo = "";
        
        if (context) {
            const isUserTransaction = context.isCurrentUser ||
                (context.currentUserAddress && participants.includes(context.currentUserAddress));

            if (isUserTransaction) {
                pronounContext = `IMPORTANT: This is the current user's transaction. Use "you" and "your" when referring to the wallet/account.`;
            } else {
                pronounContext = `IMPORTANT: This is ${context.senderName}'s transaction. Use "${context.senderName}" or "they/their" when referring to the wallet/account.`;
            }

            if (context.isCurrentUser) {
                contextInfo = `This is YOUR transaction that you shared in ${context.groupName || 'the chat'}. `;
            } else {
                contextInfo = `${context.senderName} shared this transaction in ${context.groupName || 'the chat'}. `;
            }
        }

        const prompt = `Explain this Sui blockchain transaction in 1-2 simple, friendly sentences. Use clear, non-technical language.

${pronounContext}

${contextInfo}Transaction Details:
- Hash: ${digest}
- Gas Used: ${(gasUsed / 1e9).toFixed(6)} SUI
- Participants: ${participants.length} addresses

Operations:
${operations.map(op => `- ${op.type}: ${op.description}${op.amount ? ` (${op.amount} ${op.asset || 'tokens'})` : ''}`).join('\n')}

${moveCalls.length > 0 ? `Smart Contract Calls:\n${moveCalls.map(call => `- ${call.package}::${call.module}::${call.function}`).join('\n')}` : ''}

${protocolName ? `Protocol: ${protocolName}` : ''}

Keep it brief and easy to understand.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const explanation = response.text();

        console.log('Gemini API response received');
        
        return res.status(200).json({
            explanation,
            digest,
            cached: false,
            timestamp: new Date().toISOString(),
        });

    } catch (error) {
        console.error('Error in transaction-explain:', error);
        
        // Return a more helpful error message
        return res.status(500).json({ 
            error: error.message || 'Failed to generate explanation',
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
}

function generateSimpleExplanation(txData, context) {
    const { operations, moveCalls, protocolName } = txData;
    
    let pronoun = "User";
    if (context) {
        const isUserTransaction = context.isCurrentUser ||
            (context.currentUserAddress && txData.participants.includes(context.currentUserAddress));

        if (isUserTransaction) {
            pronoun = "You";
        } else {
            pronoun = context.senderName || "User";
        }
    }

    let explanation = `${pronoun} executed a transaction`;

    if (moveCalls.length > 0) {
        const call = moveCalls[0];
        explanation += ` calling ${call.function} on ${protocolName || 'a smart contract'}`;
    }

    if (operations.length > 0) {
        const mainOps = operations.slice(0, 3).map(op => op.description).join(', ');
        explanation += `. ${mainOps}`;
    }

    return explanation + '.';
}

