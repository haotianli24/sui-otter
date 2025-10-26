import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";

// Create a single client instance - using testnet
const client = new SuiClient({ url: getFullnodeUrl("testnet") });

export interface TransactionOperation {
    type: "transfer" | "create" | "mutate" | "delete" | "call" | "publish";
    from?: string;
    to?: string;
    amount?: string;
    asset?: string;
    objectId?: string;
    objectType?: string;
    description: string;
}

export interface MoveCall {
    package: string;
    module: string;
    function: string;
    arguments: string[];
}

export interface TransactionDetails {
    digest: string;
    gasUsed: string;
    participants: string[];
    operations: TransactionOperation[];
    moveCalls: MoveCall[];
    timestamp: string;
    protocolName?: string;
    validatorName?: string;
    cexName?: string;
}

function formatAddress(address: string | undefined | null) {
    if (!address || typeof address !== 'string') {
        return 'Unknown';
    }
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// Protocol registry mapping known package addresses to names
const KNOWN_PROTOCOLS: Record<string, string> = {
    "0x1eabed72c53feb3805120a081dc15963c204dc8d091542592abaf7a35689b2fb": "Cetus",
    "0x91bfbc386a41afcfd9b2533058d7e915a1d3829089cc268ff4333d54d6339ca1": "Turbos",
    "0x684df9c8af8583706ba48460c924284f7fde157c230bfec8c3ecfb0f8e18a854": "Stonker",
    "0x70285592c97965e811e0c6f98dccc3a9c2b4ad854b3594faab9597ada267b860": "Cetus",
    "0x2": "Sui Framework",
    "0x5d1b99f4d45f1440f2fd6f535c2aee8e550eaea7af877cafe8d456cdf4c4b8d": "Kriya",
    "0x361dd589b98e8fcda9dc7f53a4b2a5b4a5c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8": "Bluefin",
    "0xaf8cd5edc19c4512f4259f0bee101a40d41ebd73820c7a13f434611c87e57ad6": "USDT",
    "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7": "USDC",
    "0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf": "WETH",
    "0x2c8d603bc51326b8c13cef9dd07031a408a48dddb541963357661df5d3204809": "Orderbook",
    "0x6b3178db112372be5a78feb708bc39a4ef49cd52224aa34f8a23c1425d280c27": "Balance Manager",
    "0x719685bc5e45910d8e7e85240d39711e4ce9c5b23bb89cf38daabd9dc9ef915f": "Price Oracle",
    "0x794a0d48b2deccba87c8f8c0448a99ac29298a866ce19010b59e44abf45fb910": "Market Data",
    "0xe05dafb5133bcffb8d59f4e12465dc0e9faeaa05e3e342a08fe135800e3e4407": "Liquidity Pool",
    "0xf948981b806057580f91622417534f491da5f61aeaf33d0ed8e69fd5691c95ce": "Trading Engine",
    "0x2375a0b1ec12010aaea3b2545acfa2ad34cfbba03ce4b59f4c39e1e25eed1b2a": "Risk Manager",
    "0xdaa46292632c3c4d8f31f23ea0f9b36a28ff3677e9684980e4438403a67a3d8f": "Fee Collector",
    "0x0000000000000000000000000000000000000000000000000000000000000006": "Clock",
};

// Known token addresses to symbols
const KNOWN_TOKENS: Record<string, string> = {
    "0x2::sui::SUI": "SUI",
    "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC": "USDC",
    "0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN": "WETH",
    "0xaf8cd5edc19c4512f4259f0bee101a40d41ebd73820c7a13f434611c87e57ad6::coin::COIN": "USDT",
};

function resolveProtocolName(packageId: string): string {
    return KNOWN_PROTOCOLS[packageId] || "Unknown Protocol";
}

// function resolveAddressLabel(_address: string): string | null {
//     // This would typically look up in a database or registry
//     // For now, return null to use default formatting
//     return null;
// }

function resolveValidatorName(_address: string): string | null {
    // This would typically look up in a database or registry
    return null;
}

function resolveCexName(_address: string): string | null {
    // This would typically look up in a database or registry
    return null;
}

function extractTokenSymbol(objectType: string): string {
    return KNOWN_TOKENS[objectType] || "Unknown Token";
}

function parseObjectType(objectType: string): {
    packageId: string;
    module: string;
    typeName: string;
    typeParams: string[];
    protocolName: string;
} {
    if (!objectType) {
        return { packageId: "", module: "", typeName: "", typeParams: [], protocolName: "Unknown" };
    }

    // Split by :: to get package::module::type
    const parts = objectType.split("::");
    const packageId = parts[0] || "";
    const module = parts[1] || "";
    // Extract type name before the angle bracket
    const typeName = parts[2] ? parts[2].split("<")[0] : "";

    // Extract type parameters from angle brackets
    const typeParamMatch = objectType.match(/<([^>]+)>/);
    const typeParams = typeParamMatch ? typeParamMatch[1].split(",").map((p) => p.trim()) : [];

    return {
        packageId,
        module,
        typeName,
        typeParams,
        protocolName: resolveProtocolName(packageId),
    };
}

function parseTransactionChanges(txData: any): TransactionOperation[] {
    const operations: TransactionOperation[] = [];
    const sender = txData.transaction?.data?.sender;

    // Parse object changes
    if (txData.objectChanges) {
        txData.objectChanges.forEach((change: any) => {
            switch (change.type) {
                case "created":
                    operations.push({
                        type: "create",
                        objectId: change.objectId,
                        objectType: change.objectType,
                        description: `Created ${parseObjectType(change.objectType).typeName}`,
                    });
                    break;

                case "mutated":
                    operations.push({
                        type: "mutate",
                        objectId: change.objectId,
                        objectType: change.objectType,
                        description: `Updated ${parseObjectType(change.objectType).typeName}`,
                    });
                    break;

                case "deleted":
                    operations.push({
                        type: "delete",
                        objectId: change.objectId,
                        objectType: change.objectType,
                        description: `Deleted ${parseObjectType(change.objectType).typeName}`,
                    });
                    break;

                case "transferred":
                    const from = change.sender || sender;
                    const to = change.recipient;
                    const objectType = change.objectType;
                    // const { typeName } = parseObjectType(objectType);
                    const tokenSymbol = extractTokenSymbol(objectType);

                    operations.push({
                        type: "transfer",
                        from: from ? formatAddress(String(from)) : "Unknown",
                        to: to ? formatAddress(String(to)) : "Unknown",
                        objectId: change.objectId,
                        objectType,
                        description: `Transferred ${tokenSymbol} from ${from ? formatAddress(String(from)) : "Unknown"} to ${to ? formatAddress(String(to)) : "Unknown"}`,
                    });
                    break;
            }
        });
    }

    // Parse balance changes
    if (txData.balanceChanges) {
        txData.balanceChanges.forEach((change: any) => {
            if (change.amount && change.amount !== "0") {
                const amount = Math.abs(parseInt(change.amount));
                const isIncrease = parseInt(change.amount) > 0;
                const tokenSymbol = extractTokenSymbol(change.coinType);

                operations.push({
                    type: "transfer",
                    from: isIncrease ? "External" : formatAddress(String(change.owner)),
                    to: isIncrease ? formatAddress(String(change.owner)) : "External",
                    amount: (amount / 1e9).toFixed(6),
                    asset: tokenSymbol,
                    description: `${isIncrease ? "Received" : "Sent"} ${(amount / 1e9).toFixed(6)} ${tokenSymbol}`,
                });
            }
        });
    }

    return operations;
}

function extractMoveCalls(txData: any): MoveCall[] {
    const moveCalls: MoveCall[] = [];

    if (txData.transaction?.data?.transactions) {
        txData.transaction.data.transactions.forEach((tx: any) => {
            if (tx.ProgrammableTransaction?.commands) {
                tx.ProgrammableTransaction.commands.forEach((command: any) => {
                    if (command.MoveCall) {
                        const call = command.MoveCall;
                        moveCalls.push({
                            package: call.package,
                            module: call.module,
                            function: call.function,
                            arguments: call.arguments || [],
                        });
                    }
                });
            }
        });
    }

    return moveCalls;
}

function extractParticipants(txData: any, _effects: any): string[] {
    const participants = new Set<string>();

    // Add sender
    if (txData.transaction?.data?.sender) {
        participants.add(txData.transaction.data.sender);
    }

    // Add recipients from object changes
    if (txData.objectChanges) {
        txData.objectChanges.forEach((change: any) => {
            if (change.sender) participants.add(change.sender);
            if (change.recipient) participants.add(change.recipient);
        });
    }

    // Add participants from balance changes
    if (txData.balanceChanges) {
        txData.balanceChanges.forEach((change: any) => {
            if (change.owner) participants.add(change.owner);
        });
    }

    return Array.from(participants);
}

export async function getTransactionDetails(digest: string): Promise<TransactionDetails | null> {
    try {
        if (!digest) {
            throw new Error("Transaction digest is required");
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
            throw new Error("Transaction not found");
        }

        const operations = parseTransactionChanges(txData);
        const moveCalls = extractMoveCalls(txData);
        const participants = extractParticipants(txData, txData.effects);

        const gasUsed = txData.effects?.gasUsed
            ? (Number(txData.effects.gasUsed.computationCost) || 0) + (Number(txData.effects.gasUsed.storageCost) || 0) - (Number(txData.effects.gasUsed.storageRebate) || 0)
            : 0;

        // Resolve protocol and address information
        const sender = txData.transaction?.data?.sender;
        const protocolName = moveCalls.length > 0 ? resolveProtocolName(moveCalls[0].package) : undefined;
        const validatorName = sender ? resolveValidatorName(sender) || undefined : undefined;
        const cexName = sender ? resolveCexName(sender) || undefined : undefined;

        const transactionDetails: TransactionDetails = {
            digest,
            gasUsed: (gasUsed / 1e9).toFixed(6),
            participants,
            operations,
            moveCalls,
            timestamp: new Date().toISOString(),
            protocolName,
            validatorName,
            cexName,
        };

        return transactionDetails;
    } catch (error) {
        console.error("Error fetching transaction:", error);

        // Provide more specific error messages
        if (error instanceof Error) {
            if (error.message.includes("not found")) {
                console.error(`Transaction ${digest} not found on testnet`);
            } else if (error.message.includes("network")) {
                console.error("Network error while fetching transaction");
            } else {
                console.error(`Unexpected error: ${error.message}`);
            }
        }

        return null;
    }
}
