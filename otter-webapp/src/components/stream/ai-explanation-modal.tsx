

import { useState } from "react";
import { Copy, ExternalLink, Loader2, AlertCircle, Check, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";

interface AIExplanationModalProps {
    isOpen: boolean;
    onClose: () => void;
    digest: string;
    txData?: any;
}

export function AIExplanationModal({ isOpen, onClose, digest, txData }: AIExplanationModalProps) {
    const [explanation, setExplanation] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showRawData, setShowRawData] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(digest);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error("Failed to copy:", error);
        }
    };

    const generateExplanation = async () => {
        if (explanation || isLoading) return;

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch("/api/transaction-explain", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    digest,
                    txData,
                    context: {
                        senderName: "User",
                        isCurrentUser: true,
                        groupName: "Activity Stream"
                    }
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to generate explanation");
            }

            const data = await response.json();
            setExplanation(data.explanation);
        } catch (err) {
            console.error("Error generating explanation:", err);
            setError(err instanceof Error ? err.message : "Failed to generate explanation");
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            onClose();
            // Reset state when closing
            setExplanation(null);
            setError(null);
            setShowRawData(false);
        }
    };

    // Generate explanation when modal opens
    useState(() => {
        if (isOpen && !explanation && !isLoading && !error) {
            generateExplanation();
        }
    });

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <span>AI Transaction Explanation</span>
                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">✨ AI</span>
                    </DialogTitle>
                    <DialogDescription>
                        Understanding transaction {digest.slice(0, 8)}...{digest.slice(-8)}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Transaction Hash */}
                    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                        <span className="text-sm font-medium">Transaction Hash:</span>
                        <code className="text-xs bg-background px-2 py-1 rounded flex-1">
                            {digest}
                        </code>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCopy}
                            className="h-8 w-8 p-0"
                        >
                            {copied ? (
                                <Check className="h-4 w-4 text-green-500" />
                            ) : (
                                <Copy className="h-4 w-4" />
                            )}
                        </Button>
                    </div>

                    {/* AI Explanation */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="font-medium">AI Explanation</h3>
                            {!explanation && !isLoading && !error && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={generateExplanation}
                                    disabled={isLoading}
                                >
                                    Generate
                                </Button>
                            )}
                        </div>

                        {isLoading && (
                            <div className="flex items-center gap-2 p-4 bg-muted/50 rounded-lg">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span className="text-sm">Generating AI explanation...</span>
                            </div>
                        )}

                        {error && (
                            <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
                                <AlertCircle className="h-4 w-4 text-red-500" />
                                <div className="flex-1">
                                    <p className="text-sm text-red-700">{error}</p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={generateExplanation}
                                        className="mt-2"
                                    >
                                        Retry
                                    </Button>
                                </div>
                            </div>
                        )}

                        {explanation && (
                            <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                                <p className="text-sm leading-relaxed">{explanation}</p>
                            </div>
                        )}
                    </div>

                    {/* Raw Data Toggle */}
                    {txData && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="font-medium">Raw Transaction Data</h3>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowRawData(!showRawData)}
                                    className="flex items-center gap-2"
                                >
                                    {showRawData ? (
                                        <>
                                            <EyeOff className="h-4 w-4" />
                                            Hide
                                        </>
                                    ) : (
                                        <>
                                            <Eye className="h-4 w-4" />
                                            Show
                                        </>
                                    )}
                                </Button>
                            </div>

                            {showRawData && (
                                <div className="max-h-60 overflow-y-auto">
                                    <pre className="text-xs bg-muted p-3 rounded-lg overflow-x-auto">
                                        {JSON.stringify(txData, null, 2)}
                                    </pre>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-4 border-t">
                        <Button
                            variant="outline"
                            onClick={() => window.open(`https://suiexplorer.com/txblock/${digest}`, '_blank')}
                            className="flex items-center gap-2"
                        >
                            <ExternalLink className="h-4 w-4" />
                            View on SuiScan
                        </Button>
                        <Button
                            variant="outline"
                            onClick={handleCopy}
                            className="flex items-center gap-2"
                        >
                            {copied ? (
                                <>
                                    <Check className="h-4 w-4" />
                                    Copied
                                </>
                            ) : (
                                <>
                                    <Copy className="h-4 w-4" />
                                    Copy Hash
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
