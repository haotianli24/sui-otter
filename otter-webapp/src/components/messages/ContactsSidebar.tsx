import { useEffect, useState } from "react";
import { useMessaging } from "@/contexts/messaging-context";
import { cn } from "@/lib/utils";

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
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h3 className="card-heading">Contacts</h3>
        <button
          className={cn(
            "small-text px-3 py-1 border rounded hover:bg-accent transition-smooth",
            (!isReady || isLoading) && "opacity-50 cursor-not-allowed"
          )}
          onClick={refreshChannels}
          disabled={!isReady || isLoading}
        >
          {isLoading ? "..." : "Refresh"}
        </button>
      </div>

      {/* New DM inline box */}
      <div className="p-4 border-b border-border space-y-3">
        <label htmlFor="new-dm" className="small-text">Start a new DM (wallet address)</label>
        <div className="flex gap-2">
          <input
            id="new-dm"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="0x..."
            className="form-input flex-1"
            disabled={!isReady || isInitializing}
          />
          <button
            onClick={onCreate}
            disabled={!recipient.trim() || creating || !isReady || isInitializing}
            className={cn(
              "small-text px-3 py-1 border rounded bg-card hover:bg-accent transition-smooth",
              (!recipient.trim() || creating || !isReady || isInitializing) && "opacity-50 cursor-not-allowed"
            )}
          >
            {creating ? "Creating" : "Create"}
          </button>
        </div>
        {!isReady && (
          <p className="small-text">Initialize messaging to start a new DM.</p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide">
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
            <p className="small-text text-destructive">Error loading conversations: {error}</p>
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
          <ul>
            {channels
              .slice()
              .sort((a, b) => {
                const aTime = a.lastMessage ? Number(a.lastMessage.timestamp) : Number(a.createdAt);
                const bTime = b.lastMessage ? Number(b.lastMessage.timestamp) : Number(b.createdAt);
                return bTime - aTime;
              })
              .map((ch) => (
                <li key={ch.id}>
                  <button
                    className="w-full text-left p-4 border-b border-border hover:bg-accent transition-smooth"
                    onClick={() => {
                      window.location.hash = ch.id;
                    }}
                  >
                    <div className="card-heading truncate">Chat with User {ch.id.slice(-4)}</div>
                    {ch.lastMessage ? (
                      <div className="small-text muted-text truncate mt-1">
                        {ch.lastMessage.content.length > 50 ? `${ch.lastMessage.content.slice(0, 50)}…` : ch.lastMessage.content}
                      </div>
                    ) : (
                      <div className="small-text muted-text mt-1">No messages yet</div>
                    )}
                  </button>
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
