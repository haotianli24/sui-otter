"use client";

import { useState } from "react";
import { Copy, ExternalLink, Bot, Clock, Users, Zap, ArrowDown, ArrowUp, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatAddress, resolveAddressLabel } from "@/lib/protocol-registry";
import { formatDistanceToNow } from "date-fns";
import TransactionEmbed from "@/components/transaction/TransactionEmbed";

interface ActivityItemProps {
    digest: string;
    timestamp: string;
    sender: string;
    type: 'incoming' | 'outgoing';
    gasUsed: string;
    operationsCount: number;
    participants: string[];
    onViewDetails?: (digest: string) => void;
    currentUserAddress?: string;
}

export function ActivityItem({
    digest,
    timestamp,
    sender,
    type,
    gasUsed,
    operationsCount,
    participants,
    onViewDetails,
    currentUserAddress,
}: ActivityItemProps) {
    const [showAIExplanation, setShowAIExplanation] = useState(false);
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


    const getTypeIcon = () => {
        switch (type) {
            case 'incoming':
                return <ArrowDown className="h-5 w-5 text-green-600" />;
            case 'outgoing':
                return <ArrowUp className="h-5 w-5 text-blue-600" />;
            default:
                return <Activity className="h-5 w-5 text-gray-600" />;
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
                {/* Transaction Summary */}
                <div className="p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {getTypeIcon()}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <Badge variant="outline" className={getTypeColor()}>
                                        {type}
                                    </Badge>
                                    <span className="text-sm muted-text">
                                        {formatTime(timestamp)}
                                    </span>
                                </div>
                                <p className="text-sm font-medium truncate">
                                    {getSummaryText()}
                                </p>
                                <div className="flex items-center gap-4 text-xs muted-text mt-1">
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
                            {/* AI Explanation Button - Always visible */}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowAIExplanation(!showAIExplanation);
                                }}
                                className={`p-2 transition-all duration-200 ${showAIExplanation
                                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                                    : ''
                                    }`}
                                title={showAIExplanation ? "Hide AI explanation" : "Show AI explanation"}
                            >
                                <Bot className="h-4 w-4" />
                            </Button>

                            {/* Copy Button */}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleCopy();
                                }}
                                className="flex items-center gap-1"
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

                            {/* View Button */}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (onViewDetails) {
                                        try { onViewDetails(digest); } catch { }
                                    }
                                    window.open(`https://suiexplorer.com/txblock/${digest}`, '_blank');
                                }}
                                className="flex items-center gap-1"
                            >
                                <ExternalLink className="h-3 w-3" />
                                View
                            </Button>

                        </div>
                    </div>
                </div>

                {/* AI Explanation View */}
                {showAIExplanation && (
                    <div className="border-t border-border p-4 bg-muted/20">
                        <div className="w-full [&_.max-w-md]:max-w-none">
                            <TransactionEmbed
                                digest={digest}
                                senderName={resolveAddressLabel(sender) || formatAddress(sender)}
                                isCurrentUser={currentUserAddress && participants.includes(currentUserAddress)}
                                groupName="Activity Stream"
                                currentUserAddress={currentUserAddress}
                            />
                        </div>
                    </div>
                )}
            </div>

        </>
    );
}
