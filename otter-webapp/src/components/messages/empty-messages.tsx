import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, MessageSquare } from "lucide-react";
import { useMessaging } from "@/contexts/messaging-context";

export function EmptyMessages() {
  const [showRecipientBox, setShowRecipientBox] = useState(false);
  const [recipientAddress, setRecipientAddress] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const { createChannel, isReady, initializeSession, isInitializing, channels } = useMessaging();

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

  const hasChannels = channels && channels.length > 0;

  return (
    <div className="flex-1 flex items-center justify-center bg-background p-6">
      <div className="text-center max-w-lg space-y-6">
        <div className="space-y-4">
          <MessageSquare className="h-20 w-20 mx-auto text-muted-foreground/40" />
          <h3 className="section-heading">
            {hasChannels ? "No messages selected" : "No messages yet"}
          </h3>
          <p className="muted-text">
            {hasChannels
              ? "Select a conversation from the sidebar to start chatting."
              : "Start a conversation by creating a new message channel with another user."
            }
          </p>
        </div>

        {isReady && (
          <div className="flex flex-col items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              onClick={() => setShowRecipientBox((s) => !s)}
            >
              <Plus className="h-4 w-4" />
              Start New Conversation
            </Button>

            {showRecipientBox && (
              <div className="w-full border rounded-lg p-6 text-left bg-card shadow-sm">
                <div className="space-y-4">
                  <div>
                    <label htmlFor="recipient" className="form-label">
                      Recipient Wallet Address
                    </label>
                    <Input
                      id="recipient"
                      placeholder="0x..."
                      value={recipientAddress}
                      onChange={(e) => setRecipientAddress(e.target.value)}
                      className="mt-2"
                    />
                    <p className="small-text mt-2">
                      Enter the Sui wallet address of the recipient to start a direct message.
                    </p>
                  </div>

                  <div className="flex gap-3 justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowRecipientBox(false)}
                      disabled={isCreating}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleCreateChannel}
                      disabled={!recipientAddress.trim() || isCreating}
                    >
                      {isCreating ? "Creating..." : "Create Channel"}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {!isReady && (
          <div className="space-y-3">
            <p className="muted-text">Initialize messaging to start chatting.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={initializeSession}
              disabled={isInitializing}
            >
              {isInitializing ? "Initializing…" : "Initialize Messaging"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
