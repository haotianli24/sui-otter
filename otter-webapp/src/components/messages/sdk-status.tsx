"use client";

import { useCurrentAccount } from "@mysten/dapp-kit";
import { useSessionKey } from "@/providers/SessionKeyProvider";
import { useMessagingClient } from "@/providers/MessagingClientProvider";
import { Button } from "@/components/ui/button";
import { Card } from "@radix-ui/themes";
import { CheckCircle2, XCircle, AlertCircle, Loader2 } from "lucide-react";

export function SdkStatus() {
  const currentAccount = useCurrentAccount();
  const { sessionKey, isInitializing, error, initializeManually } = useSessionKey();
  const messagingClient = useMessagingClient();

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getStatusIcon = (status: boolean | null) => {
    if (status === null) {
      return <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />;
    }
    return status ? (
      <CheckCircle2 className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-destructive" />
    );
  };

  const hasSessionKey = !!sessionKey && !sessionKey.isExpired();
  const hasMessagingClient = !!messagingClient;
  const isReady = currentAccount && hasSessionKey && hasMessagingClient;

  // Calculate remaining time for session key
  const getRemainingMinutes = () => {
    if (!sessionKey) return 0;
    try {
      const exported = sessionKey.export();
      const expirationTime = exported.creationTimeMs + (exported.ttlMin * 60 * 1000);
      const remainingMs = expirationTime - Date.now();
      return Math.max(0, Math.floor(remainingMs / 60000));
    } catch (error) {
      console.error('Failed to calculate session expiry:', error);
      return 0;
    }
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold">Messaging SDK Status</h3>
          <p className="text-sm text-muted-foreground mt-1">
            The SDK uses Seal for encrypting messages and attachments. The Seal SDK requires a session key,
            which contains a signature from your account and allows the app to retrieve Seal decryption keys
            for a limited time (30 minutes) without requiring repeated confirmations for each message.
          </p>
        </div>
      </div>

      <div className="space-y-3 border-t pt-4">
        {/* Current Account */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon(!!currentAccount)}
            <span className="text-sm font-medium">Current Account:</span>
          </div>
          <span className="text-sm text-muted-foreground font-mono">
            {currentAccount ? formatAddress(currentAccount.address) : "Not connected"}
          </span>
        </div>

        {/* Session Key */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon(hasSessionKey)}
            <span className="text-sm font-medium">Session Key:</span>
          </div>
          <span className="text-sm text-muted-foreground">
            {isInitializing ? "Initializing..." : hasSessionKey ? "Active" : "Not initialized"}
          </span>
        </div>

        {/* Messaging Client */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon(hasMessagingClient)}
            <span className="text-sm font-medium">Messaging Client:</span>
          </div>
          <span className="text-sm text-muted-foreground">
            {hasMessagingClient ? "Initialized" : "Not initialized"}
          </span>
        </div>

        {/* Overall Status */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-2">
            {getStatusIcon(isReady)}
            <span className="text-sm font-semibold">Overall Status:</span>
          </div>
          <span className={`text-sm font-semibold ${isReady ? "text-green-500" : "text-destructive"}`}>
            {isReady ? "Ready" : "Not ready"}
          </span>
        </div>
      </div>

      {/* Action Section */}
      {currentAccount && !hasSessionKey && !isInitializing && (
        <div className="pt-4 border-t">
          <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
            <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium mb-2">Session initialization required</p>
              <p className="text-xs text-muted-foreground mb-3">
                You need to sign a message to initialize your session. This will allow you to send and
                receive encrypted messages for the next 30 minutes without additional confirmations.
              </p>
              <Button
                onClick={initializeManually}
                disabled={isInitializing}
                size="sm"
                className="w-full sm:w-auto"
              >
                {isInitializing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Initializing Session...
                  </>
                ) : (
                  "Initialize Session Key"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-sm text-destructive">
            Error: {error.message}
          </p>
        </div>
      )}

      {/* Session Expiry Warning */}
      {hasSessionKey && sessionKey && (
        <div className="pt-4 border-t">
          <p className="text-xs text-muted-foreground">
            Your session will expire in approximately {getRemainingMinutes()} minutes.
            You'll need to reinitialize after expiry.
          </p>
        </div>
      )}
    </Card>
  );
}

