import { useState, useEffect } from "react";
import { AlertCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getCachedTransaction, setCachedTransaction } from "@/lib/transaction-cache";
import { generateTransactionExplanation } from "@/lib/gemini-service";
import { getTransactionDetails } from "@/lib/api/transaction-explorer";

interface TransactionEmbedProps {
    digest: string;
    onViewDetails?: (digest: string) => void;
    senderName?: string;
    isCurrentUser?: boolean;
    groupName?: string;
}

interface EmbedState {
    loading: boolean;
    error: string | null;
    data: any | null;
    explanation: string | null;
}

export default function TransactionEmbed({
    digest,
    onViewDetails,
    senderName,
    isCurrentUser,
    groupName
}: TransactionEmbedProps) {
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

            // Fetch real transaction data
            const txData = await getTransactionDetails(digest);
            if (!txData) {
                throw new Error("Transaction not found");
            }

            // Get AI explanation with context
            const context = {
                senderName: senderName || "Unknown",
                isCurrentUser: isCurrentUser || false,
                groupName: groupName || "the chat"
            };

            const explanation = await generateTransactionExplanation(txData, context);

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

    const handleRefresh = () => {
        // Clear cache for this specific digest
        localStorage.removeItem(`transaction_cache_${digest}`);
        // Reload data
        loadTransactionData();
    };

    const getStatusColor = () => {
        if (state.error) return "border-red-500";
        if (state.data?.operations.some((op: any) => op.type === "transfer")) return "border-green-500";
        return "border-blue-500";
    };

    const getStatusIcon = () => {
        if (state.error) return <AlertCircle className="h-4 w-4 text-red-500" />;
        if (state.data?.operations.some((op: any) => op.type === "transfer")) return "💱";
        return "📊";
    };

    if (state.loading) {
        return <TransactionEmbedSkeleton />;
    }

    if (state.error) {
        return (
            <Card className={cn("w-full max-w-md border-2 border-red-500", getStatusColor())}>
                <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="h-4 w-4 text-red-500" />
                        <span className="text-sm font-medium text-red-500">Transaction Error</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{state.error}</p>
                    <div className="flex items-center gap-2">
                        <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                            {digest.slice(0, 8)}...{digest.slice(-8)}
                        </code>
                        <button
                            onClick={handleCopy}
                            className="text-xs px-3 py-1 border rounded bg-card hover:bg-accent disabled:opacity-50"
                        >
                            {copied ? "Copied!" : "Copy Hash"}
                        </button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={cn("w-full max-w-md border-2", getStatusColor())}>
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-lg">{getStatusIcon()}</span>
                        <CardTitle className="text-sm">Transaction</CardTitle>
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={handleCopy}
                            className="text-xs px-3 py-1 border rounded bg-card hover:bg-accent disabled:opacity-50"
                        >
                            {copied ? "Copied!" : "Copy Hash"}
                        </button>
                        <button
                            onClick={handleRefresh}
                            className="text-xs px-3 py-1 border rounded bg-card hover:bg-accent disabled:opacity-50"
                            disabled={state.loading}
                        >
                            {state.loading ? "Loading..." : "Refresh"}
                        </button>
                        {onViewDetails && (
                            <Button size="sm" variant="ghost" onClick={() => onViewDetails(digest)}>
                                <ExternalLink className="h-3 w-3" />
                            </Button>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-0">
                <div className="space-y-3">
                    {/* AI Summary - Show first and prominently */}
                    {state.explanation && (
                        <div className="bg-muted/50 p-3 rounded-lg border">
                            <div className="flex items-start gap-2">
                                <div className="text-lg">🤖</div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-foreground leading-relaxed">
                                        {state.explanation}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Transaction Digest */}
                    <div>
                        <span className="text-xs text-muted-foreground">Transaction ID:</span>
                        <code className="text-xs bg-muted px-2 py-1 rounded font-mono block break-all mt-1">
                            {digest}
                        </code>
                    </div>

                    {/* Transaction Details */}
                    {state.data && (
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Gas Used:</span>
                                <span className="font-mono">{state.data.gasUsed} SUI</span>
                            </div>

                            {state.data.protocolName && (
                                <div className="flex justify-between text-xs">
                                    <span className="text-muted-foreground">Protocol:</span>
                                    <Badge variant="secondary" className="text-xs">
                                        {state.data.protocolName}
                                    </Badge>
                                </div>
                            )}

                            {state.data.operations && state.data.operations.length > 0 && (
                                <div>
                                    <span className="text-xs text-muted-foreground">Operations:</span>
                                    <div className="mt-1 flex flex-wrap gap-2">
                                        {state.data.operations.slice(0, 3).map((op: any, index: number) => (
                                            <div key={index} className="text-xs flex items-center gap-1">
                                                <Badge variant="outline" className="text-xs">
                                                    {op.type}
                                                </Badge>
                                                {op.description && (
                                                    <span className="text-muted-foreground">
                                                        {op.description}
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                        {state.data.operations.length > 3 && (
                                            <div className="text-xs text-muted-foreground">
                                                +{state.data.operations.length - 3} more
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                </div>
            </CardContent>
        </Card>
    );
}

function TransactionEmbedSkeleton() {
    return (
        <Card className="w-full max-w-md border-2 border-muted">
            <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                    <div className="h-4 w-4 bg-muted animate-pulse rounded" />
                    <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                </div>
            </CardHeader>
            <CardContent className="pt-0">
                <div className="space-y-3">
                    <div className="h-6 bg-muted animate-pulse rounded" />
                    <div className="space-y-2">
                        <div className="h-3 bg-muted animate-pulse rounded w-3/4" />
                        <div className="h-3 bg-muted animate-pulse rounded w-1/2" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}