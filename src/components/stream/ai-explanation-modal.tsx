

import { useState, useEffect } from "react";
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
    senderName?: string;
    isCurrentUser?: boolean;
    groupName?: string;
    currentUserAddress?: string;
}

export function AIExplanationModal({ isOpen, onClose, digest, txData, senderName, isCurrentUser, groupName, currentUserAddress }: AIExplanationModalProps) {
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
        if (isLoading) return;

        // Clear existing explanation if regenerating
        if (explanation) {
            setExplanation(null);
        }

        setIsLoading(true);
        setError(null);

        try {
            // Try Vercel API first, fallback to local API
            const apiUrl = "/api/transaction-explain";
            
            const response = await fetch(apiUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    digest,
                    context: {
                        senderName: senderName || "Unknown",
                        isCurrentUser: isCurrentUser || false,
                        groupName: groupName || "Activity Stream",
                        currentUserAddress: currentUserAddress
                    }
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `API error: ${response.status}`);
            }

            const data = await response.json();
            
            if (!data.explanation) {
                throw new Error("No explanation received from API");
            }
            
            setExplanation(data.explanation);
        } catch (err) {
            console.error("Error generating explanation:", err);
            const errorMessage = err instanceof Error ? err.message : "Failed to generate explanation";
            setError(`${errorMessage}. Make sure the API server is running (npm run dev:full) or check your GEMINI_API_KEY.`);
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
    useEffect(() => {
        if (isOpen && !explanation && !isLoading && !error) {
            generateExplanation();
        }
    }, [isOpen]);

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
                            <div className="flex items-center gap-3 p-4 bg-[#4DA2FF]/10 border border-[#4DA2FF]/20 rounded-lg">
                                <Loader2 className="h-5 w-5 animate-spin text-[#4DA2FF]" />
                                <div className="flex-1">
                                    <span className="text-sm font-medium text-[#4DA2FF]">AI is analyzing your transaction...</span>
                                    <p className="text-xs text-muted-foreground mt-1">This may take a few seconds</p>
                                </div>
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
                            <div className="space-y-3">
                                <div className="p-4 bg-[#4DA2FF]/10 border border-[#4DA2FF]/20 rounded-lg">
                                    <div className="flex items-start gap-2">
                                        <div className="text-lg">🤖</div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-[#4DA2FF] mb-2">AI Explanation</p>
                                            <p className="text-sm leading-relaxed text-foreground">{explanation}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-end">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={generateExplanation}
                                        disabled={isLoading}
                                        className="flex items-center gap-2"
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Regenerating...
                                            </>
                                        ) : (
                                            <>
                                                <span>🔄</span>
                                                Regenerate
                                            </>
                                        )}
                                    </Button>
                                </div>
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
