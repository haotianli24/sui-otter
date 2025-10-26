

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Message, currentUser } from "@/lib/mock-data";
import { formatTime } from "@/lib/format-date";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { CopyTradeModal } from "./copy-trade-modal";
import { detectTransactionHash } from "@/lib/transaction-detector";
import TransactionEmbed from "@/components/transaction/TransactionEmbed";

interface MessageBubbleProps {
    message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
    const isSent = message.senderId === currentUser.id;
    const [showCopyTradeModal, setShowCopyTradeModal] = useState(false);

    // Detect transaction hash in message content
    const transactionHash = detectTransactionHash(message.content);

    if (message.type === "trade" && message.tradeData) {
        return (
            <div
                className={cn(
                    "flex mb-4",
                    isSent ? "justify-end" : "justify-start"
                )}
            >
                <div
                    className={cn(
                        "max-w-[450px] p-4 border-2",
                        isSent
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-card border-border"
                    )}
                    style={{
                        backgroundColor: isSent
                            ? 'hsl(var(--primary))'
                            : 'hsl(var(--card))'
                    }}
                >
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">📊</span>
                        <span className="font-semibold text-sm">Trade Shared</span>
                    </div>
                    <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Action:</span>
                            <span
                                className={cn(
                                    "font-semibold",
                                    message.tradeData.action === "buy"
                                        ? "text-primary"
                                        : "text-destructive"
                                )}
                            >
                                {message.tradeData.action.toUpperCase()}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Token:</span>
                            <span className="font-medium">{message.tradeData.token}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Amount:</span>
                            <span className="font-medium">{message.tradeData.amount}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Price:</span>
                            <span className="font-medium">{message.tradeData.price}</span>
                        </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-border">
                        <Button
                            size="sm"
                            className="w-full"
                            variant="outline"
                            onClick={() => setShowCopyTradeModal(true)}
                        >
                            <Copy className="h-3 w-3 mr-2" />
                            Copy Trade
                        </Button>
                    </div>
                    <CopyTradeModal
                        isOpen={showCopyTradeModal}
                        onClose={() => setShowCopyTradeModal(false)}
                        trade={message.tradeData}
                    />
                    <div className="mt-2 text-xs text-muted-foreground">
                        {formatTime(message.timestamp)}
                    </div>
                </div>
            </div>
        );
    }

    if (message.type === "crypto" && message.cryptoData) {
        return (
            <div
                className={cn(
                    "flex mb-4",
                    isSent ? "justify-end" : "justify-start"
                )}
            >
                <div
                    className={cn(
                        "max-w-[350px] p-4 border-2",
                        isSent
                            ? "bg-primary/10 border-primary"
                            : "bg-card border-border"
                    )}
                >
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">💰</span>
                        <span className="font-semibold text-sm">
                            {isSent ? "Sent" : "Received"} Crypto
                        </span>
                    </div>
                    <div className="text-2xl font-bold text-primary mb-1">
                        {message.cryptoData.amount} {message.cryptoData.token}
                    </div>
                    <div className="text-xs text-muted-foreground">
                        {formatTime(message.timestamp)}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            className={cn(
                "flex mb-4",
                isSent ? "justify-end" : "justify-start"
            )}
        >
            <div className="max-w-[450px]">
                <div
                    className={cn(
                        "px-4 py-2",
                        isSent
                            ? "bg-primary text-primary-foreground"
                            : "bg-card text-card-foreground border border-border"
                    )}
                    style={{
                        backgroundColor: isSent
                            ? 'hsl(var(--primary))'
                            : 'hsl(var(--card))'
                    }}
                >
                    <p className="text-sm break-words">{message.content}</p>
                    <div
                        className={cn(
                            "text-xs mt-1",
                            isSent
                                ? "text-primary-foreground"
                                : "text-muted-foreground"
                        )}
                    >
                        {formatTime(message.timestamp)}
                    </div>
                </div>

                {/* Transaction Embed */}
                {transactionHash && (
                    <div className="mt-2">
                        <TransactionEmbed
                            digest={transactionHash}
                            senderName={message.senderId === currentUser.id ? currentUser.name : "Other User"}
                            isCurrentUser={message.senderId === currentUser.id}
                            groupName="Trading Group"
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

