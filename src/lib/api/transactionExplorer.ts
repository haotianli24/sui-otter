import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import {
    resolveProtocolName,
    resolveValidatorName,
    resolveCexName,
    extractTokenSymbol
} from "../protocol-registry";

// Create a single client instance
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

function formatObjectDescription(change: any, _sender: string, type: string): string {
    const packageId = change.objectType?.split("::")[0] || "";
    const module = change.objectType?.split("::")[1] || "";
    const typeName = change.objectType?.split("::")[2] || "";
    const protocolName = resolveProtocolName(packageId);

    // Handle different object types
    if (typeName === "Pool") {
        if (type === "created") {
            return `Created ${protocolName} liquidity pool`;
        } else {
            return `Updated ${protocolName} pool`;
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

function parseTransactionChanges(txData: any): TransactionOperation[] {
    const operations: TransactionOperation[] = [];
    const sender = txData.transaction?.data?.sender;

    if (txData.objectChanges) {
        txData.objectChanges.forEach((change: any) => {
            const objectId = change.objectId;
            const objectType = change.objectType;
            const owner = change.owner?.AddressOwner || change.owner?.Shared || change.owner?.Immutable;

            const getFriendlyDescription = (type: string, objectType: string, owner: any) => {
                let ownerShort = "Unknown";
                if (owner && typeof owner === "string") {
                    ownerShort = `${owner.slice(0, 6)}...${owner.slice(-4)}`;
                } else if (owner && typeof owner === "object") {
                    if (owner.initial_shared_version) {
                        ownerShort = sender && typeof sender === "string" ? `${sender.slice(0, 6)}...${sender.slice(-4)}` : "Shared";
                    }
                } else if (owner === "Shared") {
                    ownerShort = sender && typeof sender === "string" ? `${sender.slice(0, 6)}...${sender.slice(-4)}` : "Shared";
                } else if (owner === "Immutable") {
                    ownerShort = "Immutable";
                } else if (!owner || owner === null) {
                    ownerShort = sender && typeof sender === "string" ? `${sender.slice(0, 6)}...${sender.slice(-4)}` : "Unknown";
                }

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
                    let deletedOwnerShort = "Unknown";
                    const deletedOwner = change.owner?.AddressOwner || (change.owner?.Shared ? "Shared" : "Immutable");
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

    // Handle Move calls
    if (txData.transaction?.data?.transactions) {
        txData.transaction.data.transactions.forEach((tx: any) => {
            if (tx.MoveCall) {
                const getMoveCallDescription = (module: string, functionName: string) => {
                    const functionNameClean = functionName.replace(/_/g, " ").toLowerCase();
                    const senderShort = sender && typeof sender === "string" ? `${sender.slice(0, 6)}...${sender.slice(-4)}` : "Unknown";

                    const packageId = module.split("::")[0];
                    const protocolName = resolveProtocolName(packageId);

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
        const gasUsed = (Number(txData.effects.gasUsed.computationCost) || 0) + (Number(txData.effects.gasUsed.storageCost) || 0) - (Number(txData.effects.gasUsed.storageRebate) || 0);
        const senderShort = sender && typeof sender === "string" ? `${sender.slice(0, 6)}...${sender.slice(-4)}` : "Unknown";
        operations.push({
            type: "transfer",
            from: sender,
            description: `Gas fee: ${gasUsed / 1e9} SUI paid by ${senderShort} to validators`,
            asset: "SUI",
            amount: (gasUsed / 1e9).toFixed(6),
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
        return null;
    }
}
