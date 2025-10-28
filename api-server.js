import http from 'http';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const PORT = 3001;
const client = new SuiClient({ url: getFullnodeUrl('testnet') });

// Inline protocol helpers (mirrors src/lib/protocol-registry.ts to avoid TS import at runtime)
const KNOWN_PROTOCOLS = {
    "0x1eabed72c53feb3805120a081dc15963c204dc8d091542592abaf7a35689b2fb": { name: "Cetus" },
    "0x91bfbc386a41afcfd9b2533058d7e915a1d3829089cc268ff4333d54d6339ca1": { name: "Turbos" },
    "0x5d1b99f4d45f1440f2fd6f535c2aee8e550eaea7af877cafe8d456cdf4c4b8d": { name: "Kriya" },
    "0x361dd589b98e8fcda9dc7f53a4b2a5b4a5c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8": { name: "Bluefin" },
    "0x2c8d603bc51326b8c13cef9dd07031a408a48dddb541963357661df5d3204809": { name: "Orderbook" },
    "0x6b3178db112372be5a78feb708bc39a4ef49cd52224aa34f8a23c1425d280c27": { name: "Balance Manager" },
    "0x684df9c8af8583706ba48460c924284f7fde157c230bfec8c3ecfb0f8e18a854": { name: "Stonker" },
    "0x2": { name: "Sui Framework" },
    "0x719685bc5e45910d8e7e85240d39711e4ce9c5b23bb89cf38daabd9dc9ef915f": { name: "Price Oracle" },
    "0x794a0d48b2deccba87c8f8c0448a99ac29298a866ce19010b59e44abf45fb910": { name: "Market Data" },
    "0xe05dafb5133bcffb8d59f4e12465dc0e9faeaa05e3e342a08fe135800e3e4407": { name: "Liquidity Pool" },
    "0xf948981b806057580f91622417534f491da5f61aeaf33d0ed8e69fd5691c95ce": { name: "Trading Engine" },
    "0x2375a0b1ec12010aaea3b2545acfa2ad34cfbba03ce4b59f4c39e1e25eed1b2a": { name: "Risk Manager" },
    "0xdaa46292632c3c4d8f31f23ea0f9b36a28ff3677e9684980e4438403a67a3d8f": { name: "Fee Collector" },
    "0x0000000000000000000000000000000000000000000000000000000000000006": { name: "Clock" },
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

function resolveValidatorName(_address) {
    return null; // keep simple; archived route used optional labels only
}

function resolveCexName(_address) {
    return null;
}

function extractTokenSymbol(typeStr) {
    if (!typeStr) return 'Unknown';
    if (KNOWN_TOKENS[typeStr]) return KNOWN_TOKENS[typeStr];
    const parts = String(typeStr).split('::');
    const lastPart = parts[parts.length - 1];
    if (lastPart === 'SUI') return 'SUI';
    if (lastPart === 'USDC') return 'USDC';
    if (lastPart === 'USDT') return 'USDT';
    if (lastPart === 'WETH') return 'WETH';
    if (lastPart === 'COIN') {
        const packageId = parts[0];
        if (packageId && packageId !== '0x2') return `${packageId.slice(0, 6)}...${packageId.slice(-4)}`;
        return 'Token';
    }
    return lastPart || 'Token';
}

function parseUrl(urlString) {
    const url = new URL(urlString, `http://localhost:${PORT}`);
    return {
        pathname: url.pathname,
        search: url.search
    };
}

async function handleRequest(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    let body = '';
    req.on('data', chunk => {
        body += chunk.toString();
    });

    req.on('end', async () => {
        try {
            const { pathname } = parseUrl(req.url);

            // Random Address Endpoint (GET)
            if (pathname === '/api/random-address' && req.method === 'GET') {
                try {
                    const recentTxs = await client.queryTransactionBlocks({
                        options: {
                            showInput: true,
                            showEffects: true,
                            showEvents: true,
                            showObjectChanges: true,
                            showBalanceChanges: true,
                        },
                        limit: 50,
                        order: 'descending',
                    });

                    if (!recentTxs.data.length) {
                        res.writeHead(404, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'No recent transactions found' }));
                        return;
                    }

                    const isValidSuiAddress = (address) => {
                        if (!address) return false;
                        if (/^0x0+$/.test(address)) return false;
                        return address.startsWith('0x') && address.length === 66;
                    };

                    const validTxs = recentTxs.data.filter((tx) => {
                        const senderAddress = tx.transaction?.data?.sender;
                        return senderAddress && isValidSuiAddress(senderAddress);
                    });

                    if (!validTxs.length) {
                        res.writeHead(404, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'No valid addresses found' }));
                        return;
                    }

                    const randomTx = validTxs[Math.floor(Math.random() * validTxs.length)];
                    const senderAddress = randomTx.transaction?.data?.sender;

                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        address: senderAddress,
                        digest: randomTx.digest,
                        timestamp: randomTx.timestampMs,
                    }));
                    return;
                } catch (e) {
                    console.error('Error fetching random address:', e);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Failed to fetch random address' }));
                    return;
                }
            }

            if (pathname === '/api/address-activity' && req.method === 'POST') {
                try {
                    const { address, limit = 50, cursor } = JSON.parse(body);

                    if (!address) {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Address is required' }));
                        return;
                    }

                    if (!address.startsWith('0x') || address.length !== 66) {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Invalid address format' }));
                        return;
                    }

                    const [outgoingTxs, incomingTxs] = await Promise.all([
                        client.queryTransactionBlocks({
                            filter: { FromAddress: address },
                            options: {
                                showInput: true,
                                showEffects: true,
                                showEvents: true,
                                showObjectChanges: true,
                                showBalanceChanges: true,
                            },
                            limit: Math.ceil(limit / 2),
                            order: 'descending',
                        }),
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
                        })
                    ]);

                    const allTxs = [
                        ...outgoingTxs.data.map(tx => ({ ...tx, type: 'outgoing' })),
                        ...incomingTxs.data.map(tx => ({ ...tx, type: 'incoming' }))
                    ].sort((a, b) => {
                        const timestampA = new Date(a.timestampMs || 0).getTime();
                        const timestampB = new Date(b.timestampMs || 0).getTime();
                        return timestampB - timestampA;
                    }).slice(0, limit);

                    const activities = allTxs.map(tx => {
                        const gasUsed = tx.effects?.gasUsed
                            ? (Number(tx.effects.gasUsed.computationCost) + Number(tx.effects.gasUsed.storageCost) - Number(tx.effects.gasUsed.storageRebate)) / 1e9
                            : 0;

                        const participants = new Set();
                        if (tx.transaction?.data?.sender) {
                            participants.add(tx.transaction.data.sender);
                        }

                        if (tx.objectChanges) {
                            tx.objectChanges.forEach(change => {
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

                    const hasMore = allTxs.length === limit;
                    const nextCursor = hasMore ? allTxs[allTxs.length - 1]?.digest : undefined;

                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        activities,
                        hasMore,
                        nextCursor,
                        totalCount: activities.length
                    }));
                } catch (error) {
                    console.error('Error in address-activity:', error);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Failed to fetch activities' }));
                }
            } else if (pathname === '/api/transaction-explorer' && req.method === 'POST') {
                const { digest } = JSON.parse(body);

                if (!digest) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Transaction digest is required' }));
                    return;
                }

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
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Transaction not found' }));
                    return;
                }

                const operations = parseTransactionChanges(txData);
                const moveCalls = extractMoveCalls(txData);
                const participants = extractParticipants(txData, txData.effects);

                const gasUsed = txData.effects?.gasUsed
                    ? (Number(txData.effects.gasUsed.computationCost) || 0) + (Number(txData.effects.gasUsed.storageCost) || 0) - (Number(txData.effects.gasUsed.storageRebate) || 0)
                    : 0;

                const sender = txData.transaction?.data?.sender;
                const protocolName = moveCalls.length > 0 ? resolveProtocolName(moveCalls[0].package) : undefined;
                const validatorName = sender ? resolveValidatorName(sender) || undefined : undefined;
                const cexName = sender ? resolveCexName(sender) || undefined : undefined;

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    digest,
                    gasUsed: (gasUsed / 1e9).toFixed(6),
                    participants,
                    operations,
                    moveCalls,
                    timestamp: new Date().toISOString(),
                    protocolName,
                    validatorName,
                    cexName,
                }));
            } else if (pathname === '/api/transaction-explain' && req.method === 'POST') {
                const { digest, context } = JSON.parse(body);

                if (!digest) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Transaction digest is required' }));
                    return;
                }

                // Fetch real transaction data
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
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Transaction not found' }));
                    return;
                }

                // Parse transaction data
                const operations = parseTransactionChanges(txData);
                const moveCalls = extractMoveCalls(txData);
                const participants = extractParticipants(txData, txData.effects);
                const gasUsed = txData.effects?.gasUsed
                    ? (Number(txData.effects.gasUsed.computationCost) || 0) + (Number(txData.effects.gasUsed.storageCost) || 0) - (Number(txData.effects.gasUsed.storageRebate) || 0)
                    : 0;
                const sender = txData.transaction?.data?.sender;
                const protocolName = moveCalls.length > 0 ? resolveProtocolName(moveCalls[0].package) : undefined;
                const validatorName = sender ? resolveValidatorName(sender) || undefined : undefined;
                const cexName = sender ? resolveCexName(sender) || undefined : undefined;

                // Call GEMINI API with real transaction data
                const apiKey = process.env.GEMINI_API_KEY;
                if (!apiKey) {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'GEMINI API key not configured' }));
                    return;
                }

                const genAI = new GoogleGenerativeAI(apiKey);
                const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

                const prompt = `Explain this Sui transaction in 1-2 simple sentences. Be concise and clear:

                Transaction: ${digest}
                Gas: ${(gasUsed / 1e9).toFixed(6)} SUI
                Operations: ${operations.map(op => `${op.type}: ${op.description}`).join(', ')}
                ${moveCalls.length > 0 ? `Smart Contract: ${moveCalls[0].function}` : ''}
                ${protocolName ? `Protocol: ${protocolName}` : ''}

                Just explain what the user did in plain English.`;

                const result = await model.generateContent(prompt);
                const response = await result.response;
                const explanation = response.text();

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    explanation,
                    digest,
                    cached: false,
                    timestamp: new Date().toISOString(),
                }));
            } else {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Not found' }));
            }
        } catch (error) {
            console.error('Error:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal server error' }));
        }
    });
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
        if (type === 'created') {
            return `Created ${protocolName} liquidity pool (${token1}/${token2})`;
        } else {
            return `Updated ${protocolName} pool (${token1}/${token2})`;
        }
    }

    if (typeName === 'Position') {
        if (type === 'created') {
            return `Opened position in ${protocolName}`;
        } else {
            return `Modified ${protocolName} position`;
        }
    }

    if (typeName === 'Coin') {
        const tokenSymbol = extractTokenSymbol(change.objectType);
        if (type === 'created') {
            return `Minted ${tokenSymbol} tokens`;
        } else {
            return `Updated ${tokenSymbol} balance`;
        }
    }

    if (
        typeName.toLowerCase().includes('nft') ||
        typeName.toLowerCase().includes('token') ||
        typeName.toLowerCase().includes('item')
    ) {
        if (type === 'created') {
            return `Created NFT/collectible`;
        } else {
            return `Updated NFT/collectible`;
        }
    }

    if (protocolName !== 'Unknown Protocol') {
        if (type === 'created') {
            return `Created ${protocolName} ${module} object`;
        } else {
            return `Updated ${protocolName} ${module}`;
        }
    }

    if (type === 'created') {
        return `Created new object`;
    } else {
        return `Updated object`;
    }
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

// GEMINI API integration
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 6000; // 6 seconds between requests

async function generateTransactionExplanation(txData, context) {
    try {
        // Check if we have API key
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.log("No Gemini API key, using fallback");
            return generateSimpleExplanation(txData, context);
        }

        // Simple rate limiting
        const now = Date.now();
        if (now - lastRequestTime < MIN_REQUEST_INTERVAL) {
            console.log("Rate limiting: using fallback explanation");
            return generateSimpleExplanation(txData, context);
        }
        lastRequestTime = now;

        // Build context-aware prompt
        let contextInfo = "";
        if (context) {
            if (context.isCurrentUser) {
                contextInfo = `This is YOUR transaction that you shared in ${context.groupName || 'the chat'}. `;
            } else {
                contextInfo = `${context.senderName} shared this transaction in ${context.groupName || 'the chat'}. `;
            }
        }

        // Build personalized context for pronoun usage
        let pronounContext = "";
        if (context) {
            // Check if any transaction participants match the current user's address
            const isUserTransaction = context.isCurrentUser ||
                (context.currentUserAddress && txData.participants.includes(context.currentUserAddress));

            if (isUserTransaction) {
                pronounContext = `IMPORTANT: This is the current user's transaction. When referring to the wallet/account that performed this transaction, use "you" and "your". For example: "You transferred tokens" or "Your wallet created a new object".`;
            } else {
                pronounContext = `IMPORTANT: This is ${context.senderName}'s transaction. When referring to the wallet/account that performed this transaction, use "${context.senderName}" or "they/their". For example: "${context.senderName} transferred tokens" or "Their wallet created a new object".`;
            }
        }

        // Build protocol and address context
        let protocolContext = "";
        if (txData.protocolName) {
            protocolContext += `- Protocol: ${txData.protocolName}\n`;
        }
        if (txData.validatorName) {
            protocolContext += `- Validator: ${txData.validatorName}\n`;
        }
        if (txData.cexName) {
            protocolContext += `- Exchange: ${txData.cexName}\n`;
        }

        // Call the actual Gemini API
        try {
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

            const prompt = `Given a Sui blockchain transaction digest, explain in simple, friendly language what this transaction entails. Include the following details:

    The type of transaction (e.g., transfer, minting, object mutation)

    The main objects involved and their roles

    The outcome or effect of the transaction

    Any relevant context needed for understanding

    Use clear, non-technical language suitable for a general audience

    Keep the explanation brief, no more than a few sentences

Make it easy to understand for someone with no blockchain background.

${pronounContext}

${contextInfo}Transaction Details:
- Hash: ${txData.digest}
- Gas Used: ${txData.gasUsed} SUI
- Participants: ${txData.participants.length} addresses

Operations:
${txData.operations.map(op => `- ${op.type}: ${op.description}${op.amount ? ` (${op.amount} ${op.asset || 'tokens'})` : ''}`).join('\n')}

Move Calls:
${txData.moveCalls.map(call => `- ${call.package}::${call.module}::${call.function}`).join('\n')}

${protocolContext ? `Additional Context:\n${protocolContext}` : ''}`;

            console.log("Calling Gemini API for transaction explanation...");
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const explanation = response.text();

            console.log("Gemini API response received");
            return explanation;
        } catch (apiError) {
            console.error("Gemini API call failed:", apiError);
            console.log("Falling back to static explanation");
            return generateSimpleExplanation(txData, context);
        }
    } catch (error) {
        console.error("Error generating explanation:", error);
        return generateSimpleExplanation(txData, context);
    }
}

function generateSimpleExplanation(txData, context) {
    const operations = parseTransactionChanges(txData);
    const moveCalls = extractMoveCalls(txData);

    // Use appropriate pronouns based on context
    let pronoun = "User";
    if (context) {
        // Check if any transaction participants match the current user's address
        const isUserTransaction = context.isCurrentUser ||
            (context.currentUserAddress && txData.participants.includes(context.currentUserAddress));

        if (isUserTransaction) {
            pronoun = "You";
        } else {
            pronoun = context.senderName || "User";
        }
    }

    // Determine if this is a user transaction
    const isUserTransaction = context && (context.isCurrentUser ||
        (context.currentUserAddress && txData.participants.includes(context.currentUserAddress)));

    let explanation = `${pronoun} ${isUserTransaction ? 'executed' : 'executed'} a transaction:\n\n`;

    if (moveCalls.length > 0) {
        explanation += `**Smart Contract Calls:**\n`;
        moveCalls.forEach(call => {
            const protocolName = resolveProtocolName(call.package);
            explanation += `- Called ${call.function} on ${protocolName}\n`;
        });
        explanation += '\n';
    }

    if (operations.length > 0) {
        explanation += `**Operations:**\n`;
        operations.slice(0, 5).forEach(op => {
            explanation += `- ${op.description}\n`;
        });
        if (operations.length > 5) {
            explanation += `- ... and ${operations.length - 5} more operations\n`;
        }
    }

    return explanation;
}

const server = http.createServer(handleRequest);

server.listen(PORT, () => {
    console.log(`API Server running on http://localhost:${PORT}`);
});
