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
      <div className="p-3 border-b border-border flex items-center justify-between">
        <h3 className="text-sm font-semibold">Contacts</h3>
        <button
          className={cn(
            "text-xs px-2 py-1 border rounded hover:bg-accent",
            (!isReady || isLoading) && "opacity-50 cursor-not-allowed"
          )}
          onClick={refreshChannels}
          disabled={!isReady || isLoading}
        >
          {isLoading ? "..." : "Refresh"}
        </button>
      </div>

      {/* New DM inline box */}
      <div className="p-3 border-b border-border space-y-2">
        <label htmlFor="new-dm" className="text-xs muted-text">Start a new DM (wallet address)</label>
        <div className="flex gap-2">
          <input
            id="new-dm"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="0x..."
            className="flex-1 px-2 py-1 text-sm border bg-background disabled:opacity-50"
            disabled={!isReady || isInitializing}
          />
          <button
            onClick={onCreate}
            disabled={!recipient.trim() || creating || !isReady || isInitializing}
            className={cn(
              "text-xs px-3 py-1 border rounded bg-card hover:bg-accent",
              (!recipient.trim() || creating || !isReady || isInitializing) && "opacity-50 cursor-not-allowed"
            )}
          >
            {creating ? "Creating" : "Create"}
          </button>
        </div>
        {!isReady && (
          <p className="text-[10px] muted-text">Initialize messaging to start a new DM.</p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {!isReady ? (
          <div className="p-4 text-xs muted-text">
            <button
              onClick={initializeSession}
              disabled={isInitializing}
              className={cn(
                "text-xs px-3 py-1 border rounded bg-card hover:bg-accent",
                isInitializing && "opacity-50 cursor-not-allowed"
              )}
            >
              {isInitializing ? "Initializing…" : "Initialize Messaging"}
            </button>
            <p className="mt-2">A session is required before loading your contacts.</p>
          </div>
        ) : error ? (
          <div className="p-4 text-xs text-destructive">
            <p>Error loading conversations: {error}</p>
            <button
              onClick={refreshChannels}
              className="mt-2 text-xs px-2 py-1 border rounded bg-card hover:bg-accent"
            >
              Retry
            </button>
          </div>
        ) : isLoading && channels.length === 0 ? (
          <p className="p-4 text-xs muted-text">Loading{".".repeat(dotCount)}</p>
        ) : channels.length === 0 ? (
          <p className="p-4 text-xs muted-text">No conversations yet. Create a new DM to get started.</p>
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
                    className="w-full text-left p-3 border-b border-border hover:bg-accent"
                    onClick={() => {
                      window.location.hash = ch.id;
                    }}
                  >
                    <div className="text-sm font-medium truncate">{ch.id.slice(0, 16)}…{ch.id.slice(-4)}</div>
                    {ch.lastMessage ? (
                      <div className="text-xs muted-text truncate">
                        {ch.lastMessage.content.length > 50 ? `${ch.lastMessage.content.slice(0, 50)}…` : ch.lastMessage.content}
                      </div>
                    ) : (
                      <div className="text-xs muted-text">No messages yet</div>
                    )}
                  </button>
                </li>
              ))}
            {isLoading && channels.length > 0 && (
              <li className="p-2 text-xs muted-text text-center">
                Refreshing...
              </li>
            )}
          </ul>
        )}
      </div>
    </div>
  );
}
