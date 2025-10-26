import { NextRequest, NextResponse } from "next/server";
import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import {
    resolveProtocolName,
    resolveAddressLabel,
    resolveValidatorName,
    resolveCexName,
    extractTokenSymbol
} from "@/lib/protocol-registry";

// Create a single client instance
const client = new SuiClient({ url: getFullnodeUrl("mainnet") });

interface TransactionOperation {
    type: "transfer" | "create" | "mutate" | "delete" | "call" | "publish";
    from?: string;
    to?: string;
    amount?: string;
    asset?: string;
    objectId?: string;
    objectType?: string;
    description: string;
}

interface MoveCall {
    package: string;
    module: string;
    function: string;
    arguments: string[];
}

interface TransactionDetails {
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

function formatAddress(address: string) {
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

    const protocolName = getProtocolName(packageId);

    return { packageId, module, typeName, typeParams, protocolName };
}

// Use the protocol registry function

function getProtocolName(packageId: string): string {
    return resolveProtocolName(packageId);
}

function formatObjectDescription(change: any, sender: string, type: string): string {
    const { packageId, module, typeName, typeParams, protocolName } = parseObjectType(change.objectType);
    const senderShort = sender && typeof sender === "string" ? formatAddress(sender) : "Unknown";

    // Handle different object types
    if (typeName === "Pool" && typeParams.length >= 2) {
        const token1 = extractTokenSymbol(typeParams[0]);
        const token2 = extractTokenSymbol(typeParams[1]);
        if (type === "created") {
            return `Created ${protocolName} liquidity pool (${token1}/${token2})`;
        } else {
            return `Updated ${protocolName} pool (${token1}/${token2})`;
        }
    }

    if (typeName === "Position") {
        if (type === "created") {
            return `Opened position in ${protocolName}`;
        } else {
            return `Modified ${protocolName} position`;
        }
    }

    if (typeName === "Coin") {
        const tokenSymbol = extractTokenSymbol(change.objectType);
        if (type === "created") {
            return `Minted ${tokenSymbol} tokens`;
        } else {
            return `Updated ${tokenSymbol} balance`;
        }
    }

    // Handle NFT-related types
    if (
        typeName.toLowerCase().includes("nft") ||
        typeName.toLowerCase().includes("token") ||
        typeName.toLowerCase().includes("item")
    ) {
        if (type === "created") {
            return `Created NFT/collectible`;
        } else {
            return `Updated NFT/collectible`;
        }
    }

    // Handle generic objects
    if (protocolName !== "Unknown Protocol") {
        if (type === "created") {
            return `Created ${protocolName} ${module} object`;
        } else {
            return `Updated ${protocolName} ${module}`;
        }
    }

    // Fallback to generic description
    if (type === "created") {
        return `Created new object`;
    } else {
        return `Updated object`;
    }
}

function getObjectType(objectChanges: any[], objectId: string): string | undefined {
    const change = objectChanges.find(
        (oc: any) =>
            (oc.type === "created" || oc.type === "mutated" || oc.type === "transferred") &&
            oc.objectId === objectId
    );
    return change?.objectType || change?.objectType_?.type;
}

function parseTransactionChanges(txData: any): TransactionOperation[] {
    const operations: TransactionOperation[] = [];
    const sender = txData.transaction?.data?.sender;

    if (txData.objectChanges) {
        txData.objectChanges.forEach((change: any) => {
            const objectId = change.objectId;
            const objectType = change.objectType || getObjectType(txData.objectChanges, objectId);
            const owner = change.owner?.AddressOwner || change.owner?.Shared || change.owner?.Immutable;

            // Create a more user-friendly description based on object type and owner
            const getFriendlyDescription = (type: string, objectType: string, owner: any) => {
                // Better owner parsing - handle different owner types
                let ownerShort = "Unknown";
                if (owner && typeof owner === "string") {
                    ownerShort = `${owner.slice(0, 6)}...${owner.slice(-4)}`;
                } else if (owner && typeof owner === "object") {
                    // For shared objects, use the sender as the owner
                    if (owner.initial_shared_version) {
                        ownerShort = sender && typeof sender === "string" ? `${sender.slice(0, 6)}...${sender.slice(-4)}` : "Shared";
                    }
                } else if (owner === "Shared") {
                    ownerShort = sender && typeof sender === "string" ? `${sender.slice(0, 6)}...${sender.slice(-4)}` : "Shared";
                } else if (owner === "Immutable") {
                    ownerShort = "Immutable";
                } else if (!owner || owner === null) {
                    // If no owner is specified, use the sender as the likely owner
                    ownerShort = sender && typeof sender === "string" ? `${sender.slice(0, 6)}...${sender.slice(-4)}` : "Unknown";
                }

                // Use the new smart description formatter
                const smartDescription = formatObjectDescription(change, sender, type);

                // For Coin types, we still want to show the owner
                if (objectType?.includes("Coin<")) {
                    const coinType = objectType.match(/Coin<([^>]+)>/)?.[1];
                    const tokenSymbol = extractTokenSymbol(coinType || "");
                    if (type === "created") {
                        return `Minted ${tokenSymbol} tokens to ${ownerShort}`;
                    } else {
                        return `${tokenSymbol} balance updated for ${ownerShort}`;
                    }
                }

                // For other types, use the smart description
                return smartDescription;
            };

            switch (change.type) {
                case "created":
                    operations.push({
                        type: "create",
                        objectId,
                        objectType,
                        description: getFriendlyDescription("created", objectType, owner),
                        to: owner,
                    });
                    break;
                case "mutated":
                    operations.push({
                        type: "mutate",
                        objectId,
                        objectType,
                        description: getFriendlyDescription("mutated", objectType, owner),
                        to: owner,
                    });
                    break;
                case "transferred":
                    const fromAddress = change.sender || sender;
                    const toAddress = change.owner?.AddressOwner;
                    const fromShort = fromAddress && typeof fromAddress === "string" ? `${fromAddress.slice(0, 6)}...${fromAddress.slice(-4)}` : "Unknown";
                    const toShort = toAddress && typeof toAddress === "string" ? `${toAddress.slice(0, 6)}...${toAddress.slice(-4)}` : "Unknown";

                    operations.push({
                        type: "transfer",
                        from: fromAddress,
                        to: toAddress,
                        objectId,
                        objectType,
                        description: `Object transferred from ${fromShort} to ${toShort}`,
                    });
                    break;
                case "deleted":
                    const deletedOwner = change.owner?.AddressOwner || (change.owner?.Shared ? "Shared" : "Immutable");
                    let deletedOwnerShort = "Unknown";
                    if (deletedOwner && typeof deletedOwner === "string") {
                        deletedOwnerShort = `${deletedOwner.slice(0, 6)}...${deletedOwner.slice(-4)}`;
                    } else if (deletedOwner === "Shared") {
                        deletedOwnerShort = sender && typeof sender === "string" ? `${sender.slice(0, 6)}...${sender.slice(-4)}` : "Shared";
                    } else if (deletedOwner === "Immutable") {
                        deletedOwnerShort = "Immutable";
                    }

                    operations.push({
                        type: "delete",
                        objectId,
                        objectType,
                        description: `Object deleted from ${deletedOwnerShort}`,
                    });
                    break;
                case "published":
                    operations.push({
                        type: "publish",
                        objectId: change.packageId,
                        description: `New smart contract published by ${sender && typeof sender === "string" ? `${sender.slice(0, 6)}...${sender.slice(-4)}` : "Unknown"}`,
                    });
                    break;
                default:
                    operations.push({
                        type: "mutate",
                        objectId,
                        objectType,
                        description: `An object was modified`,
                    });
            }
        });
    }

    // Handle balance changes for SUI transfers
    if (txData.balanceChanges) {
        txData.balanceChanges.forEach((balanceChange: any) => {
            const amount = Math.abs(Number(balanceChange.amount)) / 1e9;
            const isIncrease = Number(balanceChange.amount) > 0;
            const owner = balanceChange.owner?.AddressOwner;

            // Create a more descriptive message for SUI transfers
            const getTransferDescription = (isIncrease: boolean, amount: string, owner: string) => {
                const ownerShort = owner && typeof owner === "string" ? `${owner.slice(0, 6)}...${owner.slice(-4)}` : "Unknown";
                if (isIncrease) {
                    return `${ownerShort} received ${amount} SUI tokens`;
                } else {
                    return `${ownerShort} sent ${amount} SUI tokens`;
                }
            };

            operations.push({
                type: "transfer",
                from: isIncrease ? undefined : owner,
                to: isIncrease ? owner : undefined,
                amount: amount.toFixed(6),
                asset: "SUI",
                description: getTransferDescription(isIncrease, amount.toFixed(6), owner),
            });
        });
    }

    if (txData.transaction?.data?.transactions) {
        txData.transaction.data.transactions.forEach((tx: any) => {
            if (tx.MoveCall) {
                // Create a more user-friendly description for Move calls
                const getMoveCallDescription = (module: string, functionName: string) => {
                    const moduleName = module.split("::").pop() || module;
                    const functionNameClean = functionName.replace(/_/g, " ").toLowerCase();
                    const senderShort = sender && typeof sender === "string" ? `${sender.slice(0, 6)}...${sender.slice(-4)}` : "Unknown";

                    // Extract protocol name from the module
                    const packageId = module.split("::")[0];
                    const protocolName = getProtocolName(packageId);

                    // Common function patterns with protocol context
                    if (functionName.includes("swap")) {
                        return protocolName !== "Unknown Protocol" ? `Called swap on ${protocolName}` : `${senderShort} executed token swap`;
                    } else if (functionName.includes("deposit")) {
                        return protocolName !== "Unknown Protocol" ? `Deposited to ${protocolName}` : `${senderShort} executed deposit`;
                    } else if (functionName.includes("withdraw")) {
                        return protocolName !== "Unknown Protocol" ? `Withdrew from ${protocolName}` : `${senderShort} executed withdrawal`;
                    } else if (functionName.includes("transfer")) {
                        return protocolName !== "Unknown Protocol" ? `Transferred via ${protocolName}` : `${senderShort} executed transfer`;
                    } else if (functionName.includes("mint")) {
                        return protocolName !== "Unknown Protocol" ? `Minted via ${protocolName}` : `${senderShort} executed mint`;
                    } else if (functionName.includes("burn")) {
                        return protocolName !== "Unknown Protocol" ? `Burned via ${protocolName}` : `${senderShort} executed burn`;
                    } else if (functionName.includes("input_signal")) {
                        return `Called ${functionNameClean} on ${protocolName}`;
                    } else {
                        return protocolName !== "Unknown Protocol" ? `Called ${functionNameClean} on ${protocolName}` : `${senderShort} executed ${functionNameClean}`;
                    }
                };

                operations.push({
                    type: "call",
                    description: getMoveCallDescription(tx.MoveCall.module, tx.MoveCall.function),
                });
            }
        });
    }

    // Add gas usage
    if (txData.effects?.gasUsed) {
        const gasUsed = (Number(txData.effects.gasUsed.computationCost) + Number(txData.effects.gasUsed.storageCost) - Number(txData.effects.gasUsed.storageRebate)) / 1e9;
        const senderShort = sender && typeof sender === "string" ? `${sender.slice(0, 6)}...${sender.slice(-4)}` : "Unknown";
        operations.push({
            type: "transfer",
            from: sender,
            description: `Gas fee: ${gasUsed.toFixed(6)} SUI paid by ${senderShort} to validators`,
            asset: "SUI",
            amount: gasUsed.toFixed(6),
        });
    }

    return operations;
}

function extractMoveCalls(txData: any): MoveCall[] {
    const moveCalls: MoveCall[] = [];

    if (txData.transaction?.data?.transactions) {
        txData.transaction.data.transactions.forEach((tx: any) => {
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

function extractParticipants(txData: any, effects: any): string[] {
    const participants = new Set<string>();

    if (txData.transaction?.data?.sender) {
        participants.add(txData.transaction.data.sender);
    }

    if (txData.transaction?.data?.transactions) {
        txData.transaction.data.transactions.forEach((tx: any) => {
            if (tx.TransferObjects?.recipient) {
                participants.add(tx.TransferObjects.recipient);
            }
        });
    }

    if (effects.created) {
        effects.created.forEach((obj: any) => {
            if (obj.owner?.AddressOwner) {
                participants.add(obj.owner.AddressOwner);
            }
        });
    }

    if (effects.mutated) {
        effects.mutated.forEach((obj: any) => {
            if (obj.owner?.AddressOwner) {
                participants.add(obj.owner.AddressOwner);
            }
        });
    }

    return Array.from(participants);
}

export async function POST(request: NextRequest) {
    try {
        const { digest } = await request.json();

        if (!digest) {
            return NextResponse.json({ error: "Transaction digest is required" }, { status: 400 });
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
            return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
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

        return NextResponse.json(transactionDetails);
    } catch (error) {
        console.error("Error fetching transaction:", error);
        return NextResponse.json({ error: "Failed to fetch transaction details" }, { status: 500 });
    }
}
