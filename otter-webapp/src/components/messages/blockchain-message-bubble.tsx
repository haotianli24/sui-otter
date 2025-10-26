

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useCurrentAccount } from "@mysten/dapp-kit";

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

  return (
    <div className={`flex gap-3 mb-4 ${isOwn ? "flex-row-reverse" : ""}`}>
      {!isOwn && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
            {formatAddress(message.sender).slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      )}

      <div className={`flex flex-col max-w-[70%] ${isOwn ? "items-end" : "items-start"}`}>
        <div
          className={`px-4 py-2 rounded-2xl ${isOwn
              ? "bg-primary text-primary-foreground"
              : "bg-muted"
            }`}
          style={{
            backgroundColor: isOwn
              ? 'hsl(var(--primary))'
              : 'hsl(var(--muted))'
          }}
        >
          <p className="text-sm whitespace-pre-wrap break-words">
            {message.content}
          </p>
        </div>
        <div className="flex items-center gap-2 mt-1">
          {!isOwn && (
            <span className="text-xs text-muted-foreground">
              {formatAddress(message.sender)}
            </span>
          )}
          <span className="text-xs text-muted-foreground">
            {formatTime(message.timestamp)}
          </span>
        </div>
      </div>
    </div>
  );
}
