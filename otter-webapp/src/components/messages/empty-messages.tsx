

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, MessageSquare } from "lucide-react";
import { useMessaging } from "@/contexts/messaging-context";

export function EmptyMessages() {
  const [isOpen, setIsOpen] = useState(false);
  const [recipientAddress, setRecipientAddress] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const { createChannel } = useMessaging();

  const handleCreateChannel = async () => {
    if (!recipientAddress.trim()) return;

    setIsCreating(true);
    try {
      await createChannel(recipientAddress.trim());
      setIsOpen(false);
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
      <div className="text-center text-muted-foreground max-w-md">
        <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
        <h3 className="text-lg font-semibold mb-2">No messages yet</h3>
        <p className="text-sm mb-6">
          Start a conversation by creating a new message channel with another user.
        </p>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create New Message
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Start a New Conversation</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
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
                  Enter the Sui wallet address of the person you want to message
                </p>
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setIsOpen(false)}
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
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
