import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, MessageSquare } from "lucide-react";
import { useMessaging } from "@/contexts/messaging-context";

export function EmptyMessages() {
  const [showRecipientBox, setShowRecipientBox] = useState(false);
  const [recipientAddress, setRecipientAddress] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const { createChannel, isReady, initializeSession, isInitializing } = useMessaging();

  const handleCreateChannel = async () => {
    if (!recipientAddress.trim()) return;

    setIsCreating(true);
    try {
      await createChannel(recipientAddress.trim());
      setShowRecipientBox(false);
      setRecipientAddress("");
    } catch (error) {
      console.error("Failed to create channel:", error);
      // You might want to show a toast notification here
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center bg-background">
      <div className="text-center text-muted-foreground max-w-md space-y-4">
        <MessageSquare className="h-16 w-16 mx-auto opacity-50" />
        <h3 className="card-heading">No messages yet</h3>
        {isReady ? (
          <>
            <p className="body-text">
              Start a conversation by creating a new message channel with another user.
            </p>
            <div className="flex flex-col items-center gap-4">
              <Button
                variant="outline"
                className="h-16 w-16 rounded-full p-0 flex items-center justify-center"
                onClick={() => setShowRecipientBox((s) => !s)}
                title="Start a new DM"
              >
                <Plus className="h-8 w-8" />
              </Button>
              {showRecipientBox && (
                <div className="w-full border rounded-lg p-4 text-left bg-card">
                  <label htmlFor="recipient" className="text-sm font-medium">
                    Recipient Wallet Address
                  </label>
                  <Input
                    id="recipient"
                    placeholder="0x..."
                    value={recipientAddress}
                    onChange={(e) => setRecipientAddress(e.target.value)}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter the Sui wallet address of the recipient to start a direct message.
                  </p>
                  <div className="flex gap-2 justify-end mt-3">
                    <Button
                      variant="outline"
                      onClick={() => setShowRecipientBox(false)}
                      disabled={isCreating}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateChannel}
                      disabled={!recipientAddress.trim() || isCreating}
                    >
                      {isCreating ? "Creating..." : "Create Channel"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="space-y-3">
            <p className="body-text">Initialize messaging to start chatting.</p>
            <Button onClick={initializeSession} disabled={isInitializing}>
              {isInitializing ? "Initializing…" : "Initialize Messaging"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
