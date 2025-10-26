"use client";

import { MessageSquare } from "lucide-react";
import { CreateChannel } from "./createChannel";
import { useSessionKey } from "@/providers/SessionKeyProvider";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { Button } from "@/components/ui/button";

export function EmptyMessages() {
  const { sessionKey, isInitializing, initializeManually } = useSessionKey();
  const currentAccount = useCurrentAccount();

  return (
    <div className="flex-1 flex items-center justify-center bg-background">
      <div className="text-center text-muted-foreground max-w-2xl px-4">
        <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
        <h3 className="text-lg font-semibold mb-2">No messages yet</h3>
        <p className="text-sm mb-6">
          Start a conversation by creating a new message channel with other users.
        </p>
        
        {!currentAccount ? (
          <p className="text-sm text-muted-foreground">
            Please connect your wallet to start messaging
          </p>
        ) : !sessionKey ? (
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm mb-3">
                To use encrypted messaging, you need to initialize a session key first.
              </p>
              <Button
                onClick={initializeManually}
                disabled={isInitializing}
              >
                {isInitializing ? 'Initializing...' : 'Initialize Session Key'}
              </Button>
            </div>
          </div>
        ) : (
          <CreateChannel />
        )}
      </div>
    </div>
  );
}
