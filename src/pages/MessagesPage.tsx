import { useCurrentAccount } from "@mysten/dapp-kit";
import { useState, useEffect } from "react";
import { isValidSuiObjectId } from "@mysten/sui/utils";
import { SessionKeyProvider } from "../providers/SessionKeyProvider";
import { MessagingClientProvider } from "../providers/MessagingClientProvider";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { MessagingProvider } from "../contexts/messaging-context";
import { useMessaging as useMessagingContext } from "../contexts/messaging-context";
import { Button } from "../components/ui/button";
import { WalletConnection } from "../components/wallet-connection";

// Messaging components
import { Channel } from "../components/messages/Channel";
import { EmptyMessages } from "../components/messages/empty-messages";
import ContactsSidebar from "../components/messages/ContactsSidebar";

function MessagesPageContent() {
    const currentAccount = useCurrentAccount();
    const { isReady, isInitializing, initializeSession } = useMessagingContext();
    const [channelId, setChannelId] = useState<string | null>(() => {
        const hash = window.location.hash.slice(1);
        return isValidSuiObjectId(hash) ? hash : null;
    });

    // Listen for hash changes
    useEffect(() => {
        const handleHashChange = () => {
            const hash = window.location.hash.slice(1);
            setChannelId(isValidSuiObjectId(hash) ? hash : null);
        };

        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    return (
        <div className="page-container h-full flex flex-col">
            {currentAccount ? (
                !isReady ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center space-y-4">
                            <h1 className="page-heading">Messaging Setup</h1>
                            <p className="page-subtitle">Connect your wallet to enable secure messaging</p>
                            <div className="pt-2 flex justify-center">
                                <Button
                                    onClick={initializeSession}
                                    disabled={isInitializing}
                                    variant="outline"
                                    size="sm"
                                    className="flex items-center gap-2"
                                >
                                    {isInitializing ? 'Initializing…' : 'Initialize Messaging'}
                                </Button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex min-h-0 -m-6">
                        {/* Contacts sidebar */}
                        <aside className="w-80 border-r border-border bg-card flex flex-col">
                            <div className="p-6 flex-shrink-0">
                                <h1 className="page-heading">Messages</h1>
                                <p className="page-subtitle">Connect and chat with others</p>
                            </div>
                            <div className="flex-1 overflow-hidden min-h-0">
                                <ContactsSidebar />
                            </div>
                        </aside>
                        {/* Main chat pane */}
                        <main className="flex-1 flex flex-col min-h-0 bg-background">
                            {channelId ? (
                                <Channel
                                    channelId={channelId}
                                    onBack={() => {
                                        window.location.hash = '';
                                        setChannelId(null);
                                    }}
                                />
                            ) : (
                                <EmptyMessages />
                            )}
                        </main>
                    </div>
                )
            ) : (
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center space-y-4">
                        <h1 className="page-heading">Welcome to Otter</h1>
                        <p className="page-subtitle">Please sign in to continue</p>
                        <div className="pt-2">
                            <WalletConnection />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function MessagesPage() {
    return (
        <ErrorBoundary>
            <SessionKeyProvider>
                <MessagingClientProvider>
                    <MessagingProvider>
                        <MessagesPageContent />
                    </MessagingProvider>
                </MessagingClientProvider>
            </SessionKeyProvider>
        </ErrorBoundary>
    );
}

