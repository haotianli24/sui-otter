

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { useUsername } from "@/hooks/useUsernameRegistry";

interface Message {
  id: string;
  content: string;
  sender: string;
  timestamp: number;
  channelId: string;
}

interface BlockchainMessageBubbleProps {
  message: Message;
}

export function BlockchainMessageBubble({ message }: BlockchainMessageBubbleProps) {
  const currentAccount = useCurrentAccount();
  const isOwn = currentAccount && message.sender.toLowerCase() === currentAccount.address.toLowerCase();
  const { data: username } = useUsername(message.sender);

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatAddress = (address: string) => {
    if (!address) return "Unknown";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const displayName = username || formatAddress(message.sender);
  const avatarFallback = username ? username.slice(0, 2).toUpperCase() : formatAddress(message.sender).slice(0, 2).toUpperCase();

  return (
    <div className={`flex gap-3 mb-4 ${isOwn ? "flex-row-reverse" : ""}`}>
      {/* Profile picture and username for other users */}
      {!isOwn && (
        <div className="flex flex-col items-center gap-1">
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {avatarFallback}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs text-muted-foreground text-center max-w-[60px] truncate">
            {displayName}
          </span>
        </div>
      )}
      
      <div className={`flex flex-col max-w-[70%] ${isOwn ? "items-end" : "items-start"}`}>
        <div
          className={`px-4 py-2 rounded-2xl ${
            isOwn
              ? "bg-primary text-primary-foreground"
              : "bg-muted"
          }`}
        >
          <p className="text-sm whitespace-pre-wrap break-words">
            {message.content}
          </p>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-muted-foreground">
            {formatTime(message.timestamp)}
          </span>
        </div>
      </div>
    </div>
  );
}
