

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Conversation } from "@/lib/mock-data";
import { formatDistanceToNow } from "@/lib/format-date";

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
                {conversations.map((conv) => {
                    const otherUser = conv.participants[0];
                    const isSelected = conv.id === selectedId;

                    return (
                        <button
                            key={conv.id}
                            onClick={() => onSelect(conv.id)}
                            className={cn(
                                "w-full p-4 flex items-start gap-3 hover:bg-accent transition-colors border-b border-border",
                                isSelected && "bg-accent"
                            )}
                        >
                            <Avatar className="h-12 w-12">
                                <AvatarImage src="" alt={otherUser.name} />
                                <AvatarFallback className="bg-primary text-primary-foreground">
                                    {otherUser.avatar}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0 text-left">
                                <div className="flex items-center justify-between mb-1">
                                    <h3 className="font-semibold text-sm truncate">
                                        {otherUser.name}
                                    </h3>
                                    {conv.lastMessage && (
                                        <span className="text-xs text-muted-foreground ml-2">
                                            {formatDistanceToNow(conv.lastMessage.timestamp)}
                                        </span>
                                    )}
                                </div>
                                {conv.lastMessage && (
                                    <p className="text-sm text-muted-foreground truncate">
                                        {conv.lastMessage.type === "text"
                                            ? conv.lastMessage.content
                                            : conv.lastMessage.type === "trade"
                                                ? "📊 Trade shared"
                                                : "💰 Crypto sent"}
                                    </p>
                                )}
                            </div>
                            {conv.unreadCount > 0 && (
                                <div className="flex-shrink-0 h-5 min-w-[20px] px-1.5 bg-primary text-primary-foreground text-xs font-medium flex items-center justify-center">
                                    {conv.unreadCount}
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

