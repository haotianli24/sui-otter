

import { useState } from "react";
import { ChevronDown, ChevronRight, Copy, ExternalLink, Bot, Clock, Users, Zap, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatAddress, resolveAddressLabel } from "@/lib/protocol-registry";
import { formatDistanceToNow } from "date-fns";

interface ActivityItemProps {
    digest: string;
    timestamp: string;
    sender: string;
    type: 'incoming' | 'outgoing';
    gasUsed: string;
    operationsCount: number;
    participants: string[];
}

export function ActivityItem({
    digest,
    timestamp,
    sender,
    type,
    gasUsed,
    operationsCount,
    participants
}: ActivityItemProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [aiExplanation, setAiExplanation] = useState<string | null>(null);
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);
    const [aiButtonClicked, setAiButtonClicked] = useState(false);
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

    const generateAIExplanation = async () => {
        if (isGeneratingAI || aiExplanation) return;

        setAiButtonClicked(true);
        setIsGeneratingAI(true);

        try {
            // First, get the transaction data
            const txResponse = await fetch("/api/transaction-explorer", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ digest }),
            });

            if (!txResponse.ok) {
                throw new Error("Transaction not found");
            }

            const txData = await txResponse.json();

            // Then get the AI explanation
            const response = await fetch("/api/transaction-explain", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    digest,
                    txData,
                    context: {
                        senderName: resolveAddressLabel(sender) || formatAddress(sender),
                        isCurrentUser: false,
                        groupName: "Activity Stream"
                    }
                }),
            });

            if (response.ok) {
                const data = await response.json();
                setAiExplanation(data.explanation);
            } else {
                const errorData = await response.json();
                setAiExplanation(`Failed to generate AI explanation: ${errorData.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error("Error generating AI explanation:", error);
            setAiExplanation("Error: Could not load transaction data. This address may not have any transactions.");
        } finally {
            setIsGeneratingAI(false);
        }
    };

    const getTypeIcon = () => {
        switch (type) {
            case 'incoming':
                return '📥';
            case 'outgoing':
                return '📤';
            default:
                return '📊';
        }
    };

    const getTypeColor = () => {
        switch (type) {
            case 'incoming':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'outgoing':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getSummaryText = () => {
        const senderLabel = resolveAddressLabel(sender) || formatAddress(sender);
        const participantCount = participants.length;

        if (type === 'incoming') {
            return `Received from ${senderLabel}`;
        } else {
            return `Sent to ${participantCount} participant${participantCount > 1 ? 's' : ''}`;
        }
    };

    const formatTime = (timestamp: string) => {
        try {
            const date = new Date(parseInt(timestamp));
            return formatDistanceToNow(date, { addSuffix: true });
        } catch {
            return 'Unknown time';
        }
    };

    return (
        <>
            <div className="border border-border rounded-lg bg-card hover:bg-accent/50 transition-colors">
                {/* Collapsed View */}
                <div
                    className="p-4 cursor-pointer"
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="text-lg">{getTypeIcon()}</span>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <Badge variant="outline" className={getTypeColor()}>
                                        {type}
                                    </Badge>
                                    <span className="text-sm text-muted-foreground">
                                        {formatTime(timestamp)}
                                    </span>
                                </div>
                                <p className="text-sm font-medium truncate">
                                    {getSummaryText()}
                                </p>
                                <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                                    <span className="flex items-center gap-1">
                                        <Zap className="h-3 w-3" />
                                        {gasUsed} SUI
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Users className="h-3 w-3" />
                                        {participants.length} participant{participants.length > 1 ? 's' : ''}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {operationsCount} operation{operationsCount > 1 ? 's' : ''}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsExpanded(true);
                                    generateAIExplanation();
                                }}
                                disabled={isGeneratingAI}
                                className={`flex items-center gap-1 text-xs transition-all duration-200 ${aiButtonClicked
                                    ? 'bg-primary/10 text-primary border border-primary/20'
                                    : 'hover:bg-accent hover:text-accent-foreground'
                                    }`}
                            >
                                {isGeneratingAI ? (
                                    <>
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                        Generating...
                                    </>
                                ) : aiExplanation ? (
                                    <>
                                        <Check className="h-3 w-3" />
                                        Explained
                                    </>
                                ) : (
                                    <>
                                        <Bot className="h-3 w-3" />
                                        Explain
                                    </>
                                )}
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleCopy();
                                }}
                                className="flex items-center gap-1 text-xs"
                            >
                                {copied ? (
                                    <>
                                        <Copy className="h-3 w-3" />
                                        Copied
                                    </>
                                ) : (
                                    <>
                                        <Copy className="h-3 w-3" />
                                        Copy
                                    </>
                                )}
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(`https://suiexplorer.com/txblock/${digest}`, '_blank');
                                }}
                                className="flex items-center gap-1 text-xs"
                            >
                                <ExternalLink className="h-3 w-3" />
                                View
                            </Button>
                            {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                            ) : (
                                <ChevronRight className="h-4 w-4" />
                            )}
                        </div>
                    </div>
                </div>

                {/* Expanded View */}
                {isExpanded && (
                    <div className="border-t border-border p-4 bg-muted/20">
                        <div className="space-y-4">
                            {/* Transaction Details */}
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-muted-foreground">Transaction Hash:</span>
                                    <p className="font-mono text-xs break-all">{digest}</p>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Sender:</span>
                                    <p className="font-mono text-xs break-all">
                                        {resolveAddressLabel(sender) || formatAddress(sender)}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Gas Used:</span>
                                    <p className="font-medium">{gasUsed} SUI</p>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Operations:</span>
                                    <p className="font-medium">{operationsCount}</p>
                                </div>
                            </div>

                            {/* Participants */}
                            {participants.length > 0 && (
                                <div>
                                    <span className="text-sm text-muted-foreground mb-2 block">
                                        Participants ({participants.length}):
                                    </span>
                                    <div className="flex flex-wrap gap-2">
                                        {participants.slice(0, 5).map((participant, index) => (
                                            <Badge key={index} variant="secondary" className="text-xs">
                                                {resolveAddressLabel(participant) || formatAddress(participant)}
                                            </Badge>
                                        ))}
                                        {participants.length > 5 && (
                                            <Badge variant="outline" className="text-xs">
                                                +{participants.length - 5} more
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* AI Explanation */}
                            {(isGeneratingAI || aiExplanation) && (
                                <div className="mt-4 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Bot className="h-4 w-4 text-primary" />
                                        <span className="text-sm font-medium text-primary">AI Explanation</span>
                                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">✨ AI</span>
                                    </div>
                                    {isGeneratingAI ? (
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Generating explanation...
                                        </div>
                                    ) : (
                                        <p className="text-sm leading-relaxed">{aiExplanation}</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

        </>
    );
}
