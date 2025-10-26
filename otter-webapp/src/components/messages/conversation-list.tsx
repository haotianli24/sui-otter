

import { GradientAvatar } from "@/components/ui/gradient-avatar";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "@/lib/format-date";

interface User {
    id: string;
    name: string;
    address: string;
}

interface Message {
    id: string;
    content: string;
    sender: string;
    timestamp: number;
    channelId: string;
}

interface Conversation {
    id: string;
    type: "direct" | "group";
    name?: string;
    participants: User[];
    lastMessage?: Message;
    unreadCount: number;
    avatar?: string;
}

interface ConversationListProps {
    conversations: Conversation[];
    selectedId?: string;
    onSelect: (id: string) => void;
}

export function ConversationList({
    conversations,
    selectedId,
    onSelect,
}: ConversationListProps) {
    return (
        <div className="flex flex-col h-full">
            <div className="p-4 border-b border-border">
                <h2 className="text-lg font-semibold">Messages</h2>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-hide">
                <div className="space-y-0 p-3">
                    {conversations.map((conv, index) => {
                        const otherUser = conv.participants[0];
                        const isSelected = conv.id === selectedId;
                        const isLast = index === conversations.length - 1;

                        return (
                            <button
                                key={conv.id}
                                onClick={() => onSelect(conv.id)}
                                className={cn(
                                    "w-full flex items-start gap-3 p-4 transition-all duration-200 ease-in-out",
                                    "border border-transparent hover:border-border/50 hover:shadow-sm hover:bg-muted/30",
                                    "hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-primary/20",
                                    !isLast && "border-b border-border/20",
                                    isSelected
                                        ? "bg-primary/10 border-primary/30 shadow-md ring-1 ring-primary/20 scale-[1.01] rounded-xl"
                                        : "rounded-xl"
                                )}
                            >
                                <div className="relative">
                                    <GradientAvatar
                                        address={otherUser.address}
                                        size="md"
                                        className={cn(
                                            "h-12 w-12 transition-all duration-200",
                                            isSelected && "ring-2 ring-primary/30"
                                        )}
                                    />
                                    {isSelected && (
                                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-background"></div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0 text-left">
                                    <div className="flex items-center justify-between mb-1">
                                        <h3 className={cn(
                                            "font-semibold text-sm truncate transition-colors",
                                            isSelected ? "text-primary" : "text-foreground"
                                        )}>
                                            {otherUser.name}
                                        </h3>
                                        {conv.lastMessage && (
                                            <span className={cn(
                                                "text-xs ml-2 transition-colors",
                                                isSelected ? "text-primary/70" : "text-muted-foreground"
                                            )}>
                                                {formatDistanceToNow(conv.lastMessage.timestamp)}
                                            </span>
                                        )}
                                    </div>
                                    <p className={cn(
                                        "text-sm truncate transition-colors",
                                        isSelected ? "text-primary/80" : "text-muted-foreground"
                                    )}>
                                        {conv.lastMessage ? (
                                            conv.lastMessage.type === "text"
                                                ? conv.lastMessage.content
                                                : conv.lastMessage.type === "trade"
                                                    ? "📊 Trade shared"
                                                    : "💰 Crypto sent"
                                        ) : "No messages yet"}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {conv.unreadCount > 0 && (
                                        <div className="flex-shrink-0 h-5 min-w-[20px] px-1.5 bg-primary text-primary-foreground text-xs font-medium flex items-center justify-center rounded-full">
                                            {conv.unreadCount}
                                        </div>
                                    )}
                                    {isSelected && (
                                        <div className="w-1 h-8 bg-primary rounded-full"></div>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

