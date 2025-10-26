

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
        <div className="text-center text-destructive">
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
      <div className="space-y-1 p-2">
        {channels.map((channel) => (
          <div
            key={channel.id}
            onClick={() => onSelect(channel.id)}
            className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${selectedId === channel.id ? "bg-muted" : ""
              }`}
          >
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary text-primary-foreground">
                {getOtherParticipant(channel).slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium truncate">
                  {getOtherParticipant(channel)}
                </p>
                {channel.lastMessage && (
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(channel.lastMessage.timestamp))}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {channel.lastMessage?.content || "No messages yet"}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
