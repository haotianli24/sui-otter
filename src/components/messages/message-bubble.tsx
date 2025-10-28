

import { cn } from "@/lib/utils";
import { formatTime } from "@/lib/format-date";
import { detectTransactionHash } from "@/lib/transaction-detector";
import TransactionEmbed from "@/components/transaction/TransactionEmbed";
import { useUsername } from "@/hooks/useUsernameRegistry";
import { getDisplayName } from "@/contexts/UserProfileContext";

interface MessageBubbleProps {
    message: {
        id: string;
        content: string;
        sender: string;
        timestamp: number;
        channelId: string;
    };
    currentUserAddress?: string;
}

export function MessageBubble({ message, currentUserAddress }: MessageBubbleProps) {
    const { data: username } = useUsername(message.sender);
    const displayName = username || getDisplayName(message.sender);
    const isSent = currentUserAddress && message.sender.toLowerCase() === currentUserAddress.toLowerCase();

    // Detect transaction hash in message content
    const transactionHash = detectTransactionHash(message.content);

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
                        "px-4 py-2 rounded-2xl",
                        isSent
                            ? "bg-primary/10 text-foreground border border-border/50 backdrop-blur-md"
                            : "bg-secondary/80 text-foreground border border-border/50 backdrop-blur-md"
                    )}
                >
                    <p className="text-sm break-words">{message.content}</p>
                    <div
                        className={cn(
                            "text-xs mt-1",
                            "text-muted-foreground"
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
                            senderName={displayName}
                            isCurrentUser={isSent}
                            groupName="Channel"
                            currentUserAddress={currentUserAddress}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

