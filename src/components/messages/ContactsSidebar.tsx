import { useEffect, useState } from "react";
import { useMessaging } from "@/contexts/messaging-context";
import { cn } from "@/lib/utils";
import { useUsername, useUserProfile } from "@/hooks/useUsernameRegistry";
import { getDisplayName } from "@/contexts/UserProfileContext";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { GradientAvatar } from "@/components/ui/gradient-avatar";

export default function ContactsSidebar() {
  const {
    channels,
    isReady,
    isLoading,
    error,
    refreshChannels,
    createChannel,
    initializeSession,
    isInitializing,
  } = useMessaging();
  const currentAccount = useCurrentAccount();
  const [recipient, setRecipient] = useState("");
  const [creating, setCreating] = useState(false);
  const [dotCount, setDotCount] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => {
      setDotCount((prev) => (prev === 3 ? 1 : prev + 1));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // The hook already fetches channels when ready, so we don't need to call refreshChannels here
  // This useEffect was causing duplicate calls and potential race conditions

  const onCreate = async () => {
    if (!recipient.trim()) return;
    setCreating(true);
    try {
      await createChannel(recipient.trim());
      setRecipient("");
      await refreshChannels();
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 flex items-center justify-between flex-shrink-0">
        <h3 className="text-lg font-semibold">Contacts</h3>
        <button
          className={cn(
            "text-sm px-3 py-1.5 border border-border rounded-md hover:bg-accent transition-colors",
            (!isReady || isLoading) && "opacity-50 cursor-not-allowed"
          )}
          onClick={refreshChannels}
          disabled={!isReady || isLoading}
        >
          {isLoading ? "..." : "Refresh"}
        </button>
      </div>

      {/* New DM section */}
      <div className="px-6 py-4 space-y-3 flex-shrink-0">
        <label htmlFor="new-dm" className="text-sm font-medium text-foreground">Start a new DM</label>
        <div className="space-y-2">
          <input
            id="new-dm"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="Enter wallet address (0x...)"
            className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            disabled={!isReady || isInitializing}
          />
          <button
            onClick={onCreate}
            disabled={!recipient.trim() || creating || !isReady || isInitializing}
            className={cn(
              "w-full text-sm px-3 py-2 border border-border rounded-md bg-card hover:bg-accent transition-colors",
              (!recipient.trim() || creating || !isReady || isInitializing) && "opacity-50 cursor-not-allowed"
            )}
          >
            {creating ? "Creating..." : "Create Channel"}
          </button>
        </div>
        {!isReady && (
          <p className="text-xs text-muted-foreground">Initialize messaging to start a new DM.</p>
        )}
      </div>

      {/* Separator bar */}
      <div className="border-t border-border/50 flex-shrink-0"></div>

      <div className="flex-1 overflow-y-auto scrollbar-none min-h-0">
        {!isReady ? (
          <div className="p-6 space-y-4">
            <button
              onClick={initializeSession}
              disabled={isInitializing}
              className={cn(
                "small-text px-3 py-2 border rounded bg-card hover:bg-accent transition-smooth",
                isInitializing && "opacity-50 cursor-not-allowed"
              )}
            >
              {isInitializing ? "Initializing…" : "Initialize Messaging"}
            </button>
            <p className="small-text">A session is required before loading your contacts.</p>
          </div>
        ) : error ? (
          <div className="p-6 space-y-3">
            <p className="small-text text-destructive/70">Error loading conversations: {error}</p>
            <button
              onClick={refreshChannels}
              className="small-text px-3 py-1 border rounded bg-card hover:bg-accent transition-smooth"
            >
              Retry
            </button>
          </div>
        ) : isLoading && channels.length === 0 ? (
          <div className="p-6">
            <p className="small-text muted-text">Loading{".".repeat(dotCount)}</p>
          </div>
        ) : channels.length === 0 ? (
          <div className="p-6 text-center space-y-2">
            <p className="small-text muted-text">No conversations yet</p>
            <p className="small-text muted-text">Start a new chat above to get started</p>
          </div>
        ) : (
          <ul className="px-2">
            {channels
              .slice()
              .sort((a, b) => {
                const aTime = a.lastMessage ? Number(a.lastMessage.timestamp) : Number(a.createdAt);
                const bTime = b.lastMessage ? Number(b.lastMessage.timestamp) : Number(b.createdAt);
                return bTime - aTime;
              })
              .map((ch, index) => (
                <li key={ch.id} className={index < channels.length - 1 ? "border-b border-border/20" : ""}>
                  <ChannelItem channel={ch} currentAccount={currentAccount} />
                </li>
              ))}
            {isLoading && channels.length > 0 && (
              <li className="p-4 small-text muted-text text-center">
                Refreshing...
              </li>
            )}
          </ul>
        )}
      </div>
    </div>
  );
}

// Channel Item Component
interface ChannelItemProps {
  channel: {
    id: string;
    members: string[];
    createdAt: number;
    lastMessage?: {
      content: string;
      sender: string;
      timestamp: number;
    };
  };
  currentAccount: any;
}

function ChannelItem({ channel, currentAccount }: ChannelItemProps) {
  // Get the other member (not the current user)
  // Prioritize last message sender since members array seems unreliable
  let otherMember: string | undefined;
  
  // First try to get from last message sender (most reliable)
  if (channel.lastMessage && channel.lastMessage.sender !== currentAccount?.address) {
    otherMember = channel.lastMessage.sender;
  }
  
  // Fallback to members array if no last message
  if (!otherMember && channel.members && Array.isArray(channel.members)) {
    otherMember = channel.members.find(member => member !== currentAccount?.address);
  }
  
  // Debug logging to help identify the issue
  console.log('ChannelItem debug:', {
    channelId: channel.id,
    channelMembers: channel.members,
    currentAccount: currentAccount?.address,
    otherMember,
    lastMessageSender: channel.lastMessage?.sender,
    usingLastMessageSender: otherMember === channel.lastMessage?.sender
  });
  
  const { data: userProfile } = useUserProfile(otherMember || '');
  const { data: username } = useUsername(otherMember || '');
  
  // Use the same logic as ProfilePage: prioritize on-chain profile data
  const displayName = userProfile?.username || username || getDisplayName(otherMember || '');

  return (
    <button
      className="w-full text-left px-4 py-4 hover:bg-accent/50 transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary/20 rounded-lg my-1 select-none"
      onClick={() => {
        window.location.hash = channel.id;
      }}
    >
      <div className="flex items-center gap-3">
        {otherMember ? (
          <>
            <GradientAvatar 
              address={otherMember}
              size="sm"
              className="h-10 w-10"
            />
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-foreground truncate transition-colors hover:text-primary">
                {displayName}
              </div>
              {channel.lastMessage ? (
                <div className="text-sm text-muted-foreground truncate mt-1 transition-colors">
                  {channel.lastMessage.content.length > 50 ? `${channel.lastMessage.content.slice(0, 50)}…` : channel.lastMessage.content}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground mt-1">No messages yet</div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-foreground truncate transition-colors hover:text-primary">
              Group Chat
            </div>
            {channel.lastMessage ? (
              <div className="text-sm text-muted-foreground truncate mt-1 transition-colors">
                {channel.lastMessage.content.length > 50 ? `${channel.lastMessage.content.slice(0, 50)}…` : channel.lastMessage.content}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground mt-1">No messages yet</div>
            )}
          </div>
        )}
      </div>
    </button>
  );
}
