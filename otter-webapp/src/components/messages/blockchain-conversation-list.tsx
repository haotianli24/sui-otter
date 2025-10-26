

import { useState, useEffect } from "react";
import { GradientAvatar } from "@/components/ui/gradient-avatar";
import { useMessaging } from "@/contexts/messaging-context";
import { formatDistanceToNow } from "@/lib/format-date";

interface BlockchainConversationListProps {
  selectedId?: string;
  onSelect: (channelId: string) => void;
}

export function BlockchainConversationList({ selectedId, onSelect }: BlockchainConversationListProps) {
  const { channels, isLoading, error, loadMessages } = useMessaging();
  const [loadedChannels, setLoadedChannels] = useState<Set<string>>(new Set());

  // Load messages for channels when they're selected
  useEffect(() => {
    if (selectedId && !loadedChannels.has(selectedId)) {
      loadMessages(selectedId);
      setLoadedChannels(prev => new Set([...prev, selectedId]));
    }
  }, [selectedId, loadMessages, loadedChannels]);

  const formatAddress = (address: string) => {
    if (!address) return "Unknown";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getOtherParticipant = (channel: any) => {
    // For now, we'll show the channel ID since we don't have member info
    // In a real implementation, you'd get the other participant's address
    // For now, return formatted address as fallback
    return formatAddress(channel.id);
  };

  if (isLoading && channels.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto scrollbar-hide p-4">
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center space-x-3 p-3">
              <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded animate-pulse" />
                <div className="h-3 bg-muted rounded w-2/3 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 overflow-y-auto scrollbar-hide p-4">
        <div className="text-center text-destructive/70">
          <p className="text-sm">Failed to load conversations</p>
          <p className="text-xs text-muted-foreground mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (channels.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto scrollbar-hide p-4">
        <div className="text-center text-muted-foreground">
          <p className="text-sm">No conversations yet</p>
          <p className="text-xs mt-1">Create a new channel to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto scrollbar-hide">
      <div className="space-y-0 p-3">
        {channels.map((channel, index) => {
          const isSelected = selectedId === channel.id;
          const isLast = index === channels.length - 1;
          return (
            <div
              key={channel.id}
              onClick={() => onSelect(channel.id)}
              className={`
                flex items-center space-x-3 p-4 cursor-pointer transition-all duration-200 ease-in-out
                border border-transparent hover:border-border/50 hover:shadow-sm hover:bg-muted/30
                ${!isLast ? "border-b border-border/20" : ""}
                ${isSelected 
                  ? "bg-primary/10 border-primary/30 shadow-md ring-1 ring-primary/20 rounded-xl" 
                  : "hover:scale-[1.02] rounded-xl"
                }
              `}
            >
              <div className="relative">
                <GradientAvatar 
                  address={channel.id}
                  size="md"
                  className={`transition-all duration-200 ${isSelected ? "ring-2 ring-primary/30" : ""}`}
                />
                {isSelected && (
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-background"></div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className={`text-sm font-semibold truncate transition-colors ${
                    isSelected ? "text-primary" : "text-foreground"
                  }`}>
                    {getOtherParticipant(channel)}
                  </p>
                  {channel.lastMessage && (
                    <span className={`text-xs transition-colors ${
                      isSelected ? "text-primary/70" : "text-muted-foreground"
                    }`}>
                      {formatDistanceToNow(new Date(channel.lastMessage.timestamp))}
                    </span>
                  )}
                </div>
                <p className={`text-xs truncate transition-colors ${
                  isSelected ? "text-primary/80" : "text-muted-foreground"
                }`}>
                  {channel.lastMessage?.content || "No messages yet"}
                </p>
              </div>
              {isSelected && (
                <div className="w-1 h-8 bg-primary rounded-full"></div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
