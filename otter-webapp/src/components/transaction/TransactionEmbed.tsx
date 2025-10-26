"use client";

import { useState, useEffect } from "react";
import { Copy, ExternalLink, AlertCircle, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCachedTransaction, setCachedTransaction } from "@/lib/transaction-cache";
import ExpandableText from "./ExpandableText";

interface TransactionEmbedProps {
    digest: string;
    onViewDetails?: (digest: string) => void;
    senderName?: string;
    isCurrentUser?: boolean;
    groupName?: string;
}

interface TransactionData {
    digest: string;
    gasUsed: string;
    participants: string[];
    operations: Array<{
        type: string;
        description: string;
        from?: string;
        to?: string;
        amount?: string;
        asset?: string;
    }>;
    moveCalls: Array<{
        package: string;
        module: string;
        function: string;
        arguments: string[];
    }>;
}

interface EmbedState {
    loading: boolean;
    error: string | null;
    data: TransactionData | null;
    explanation: string | null;
}

export default function TransactionEmbed({ digest, onViewDetails, senderName, isCurrentUser, groupName }: TransactionEmbedProps) {
    const [state, setState] = useState<EmbedState>({
        loading: true,
        error: null,
        data: null,
        explanation: null,
    });

    const [copied, setCopied] = useState(false);

    useEffect(() => {
        loadTransactionData();
    }, [digest]);

    const loadTransactionData = async () => {
        setState(prev => ({ ...prev, loading: true, error: null }));

        try {
            // Check cache first
            const cached = getCachedTransaction(digest);
            if (cached) {
                setState({
                    loading: false,
                    error: null,
                    data: cached.txData,
                    explanation: cached.explanation,
                });
                return;
            }

            // Fetch transaction data
            const txResponse = await fetch("/api/transaction-explorer", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ digest }),
            });

            if (!txResponse.ok) {
                throw new Error("Transaction not found");
            }

            const txData = await txResponse.json();

            // Get AI explanation with context
            const context = {
                senderName: senderName || "Unknown",
                isCurrentUser: isCurrentUser || false,
                groupName: groupName || "the chat"
            };

            const explainResponse = await fetch("/api/transaction-explain", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ digest, txData, context }),
            });

            let explanation = "Transaction processed successfully.";
            if (explainResponse.ok) {
                const explainData = await explainResponse.json();
                explanation = explainData.explanation;
            }

            // Cache the result
            setCachedTransaction(digest, {
                explanation,
                txData,
                timestamp: Date.now().toString(),
                digest,
            });

            setState({
                loading: false,
                error: null,
                data: txData,
                explanation,
            });
        } catch (error) {
            console.error("Error loading transaction:", error);
            setState({
                loading: false,
                error: error instanceof Error ? error.message : "Failed to load transaction",
                data: null,
                explanation: null,
            });
        }
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(digest);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error("Failed to copy:", error);
        }
    };

    const getStatusColor = () => {
        if (state.error) return "border-red-500";
        if (state.data?.operations.some(op => op.type === "transfer")) return "border-green-500";
        return "border-blue-500";
    };

    const getStatusIcon = () => {
        if (state.error) return <AlertCircle className="h-4 w-4 text-red-500" />;
        if (state.data?.operations.some(op => op.type === "transfer")) return "💱";
        return "📊";
        return "⚡";
    };

    if (state.loading) {
        return <TransactionEmbedSkeleton />;
    }

    if (state.error) {
        return (
            <div className={`max-w-md border-l-4 ${getStatusColor()} bg-card border border-border p-4`}>
                <div className="flex items-center gap-2 mb-2">
                    {getStatusIcon()}
                    <span className="font-medium text-sm">Transaction Error</span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{state.error}</p>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={loadTransactionData}
                        className="text-xs"
                    >
                        Retry
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCopy}
                        className="text-xs"
                    >
                        <Copy className="h-3 w-3 mr-1" />
                        Copy Hash
                    </Button>
                </div>
            </div>
        );
    }

    if (!state.data) return null;

    return (
        <div className={`max-w-md border-l-4 ${getStatusColor()} bg-card border border-border p-4`}>
            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
                {getStatusIcon()}
                <span className="font-medium text-sm">Transaction Explained</span>
                <span className="text-xs text-muted-foreground">✨ AI</span>
            </div>

            {/* AI Summary */}
            {state.explanation && (
                <div className="mb-3 p-3 bg-muted/50 border border-border">
                    <p className="text-sm leading-relaxed">{state.explanation}</p>
                </div>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3 mb-3 text-xs">
                <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">⛽ Gas:</span>
                    <span className="font-medium">{state.data.gasUsed} SUI</span>
                </div>
                <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">👥 Users:</span>
                    <span className="font-medium">{state.data.participants.length}</span>
                </div>
                <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">📝 Ops:</span>
                    <span className="font-medium">{state.data.operations.length}</span>
                </div>
                <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">📜 Calls:</span>
                    <span className="font-medium">{state.data.moveCalls?.length || 0}</span>
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
                {onViewDetails && (
                    <Button
                        variant="default"
                        size="sm"
                        onClick={() => onViewDetails(digest)}
                        className="text-xs bg-primary hover:bg-primary/90"
                    >
                        View Details
                    </Button>
                )}
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopy}
                    className="text-xs"
                >
                    {copied ? (
                        <>
                            <Check className="h-3 w-3 mr-1" />
                            Copied
                        </>
                    ) : (
                        <>
                            <Copy className="h-3 w-3 mr-1" />
                            Copy Hash
                        </>
                    )}
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(`https://suiexplorer.com/txblock/${digest}`, '_blank')}
                    className="text-xs"
                >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Explorer
                </Button>
            </div>
        </div>
    );
}

// Skeleton loader component
function TransactionEmbedSkeleton() {
    return (
        <div className="max-w-md border-l-4 border-muted bg-card border border-border p-4">
            <div className="flex items-center gap-2 mb-3">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="font-medium text-sm text-muted-foreground">Loading Transaction...</span>
            </div>

            <div className="space-y-2">
                <div className="h-4 bg-muted animate-pulse rounded" />
                <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
            </div>

            <div className="grid grid-cols-2 gap-3 mt-3">
                <div className="h-3 bg-muted animate-pulse rounded" />
                <div className="h-3 bg-muted animate-pulse rounded" />
                <div className="h-3 bg-muted animate-pulse rounded" />
                <div className="h-3 bg-muted animate-pulse rounded" />
            </div>
        </div>
    );
}
