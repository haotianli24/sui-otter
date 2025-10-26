

import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { useUsername } from "@/hooks/useUsernameRegistry";
import { UserProfilePopup } from "@/components/ui/user-profile-popup";
import { getDisplayName } from "@/contexts/UserProfileContext";

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
  const [profilePopup, setProfilePopup] = useState<{
    isOpen: boolean;
    address: string;
    position: { x: number; y: number };
  }>({
    isOpen: false,
    address: '',
    position: { x: 0, y: 0 }
  });

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const displayName = username || getDisplayName(message.sender);
  const avatarFallback = username ? username.slice(0, 2).toUpperCase() : getDisplayName(message.sender).slice(0, 2).toUpperCase();

  const handleProfileClick = (address: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    const rect = event.currentTarget.getBoundingClientRect();
    setProfilePopup({
      isOpen: true,
      address,
      position: {
        x: rect.left + rect.width / 2 - 160, // Center the popup
        y: rect.top - 10
      }
    });
  };

  const closeProfilePopup = () => {
    setProfilePopup({
      isOpen: false,
      address: '',
      position: { x: 0, y: 0 }
    });
  };

  return (
    <div className={`flex gap-3 mb-4 ${isOwn ? "flex-row-reverse" : ""}`}>
      {/* Profile picture and username for other users */}
      {!isOwn && (
        <div className="flex flex-col items-center gap-1">
          <Avatar 
            className="h-8 w-8 flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={(e) => handleProfileClick(message.sender, e)}
          >
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
          <span className="text-xs text-muted-foreground">
            {formatTime(message.timestamp)}
          </span>
        </div>
      </div>

      {/* User Profile Popup */}
      <UserProfilePopup
        address={profilePopup.address}
        isOpen={profilePopup.isOpen}
        onClose={closeProfilePopup}
        position={profilePopup.position}
      />
    </div>
  );
}
