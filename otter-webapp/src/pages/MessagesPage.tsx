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
        <div className="flex-1 overflow-hidden min-h-0">
            {currentAccount ? (
                !isReady ? (
                    <div className="page-container">
                        <div className="loading-state">
                            <div className="loading-content">
                                <h1 className="page-heading">Messaging Setup</h1>
                                <p className="page-subtitle">Sign once to start the messaging service</p>
                                <div className="pt-2">
                                    <Button onClick={initializeSession} disabled={isInitializing}>
                                        {isInitializing ? 'Initializing…' : 'Initialize Messaging'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex min-h-0">
                        {/* Contacts sidebar */}
                        <aside className="w-80 border-r border-border h-full flex flex-col">
                            <div className="p-6 border-b border-border">
                                <h1 className="page-heading">Messages</h1>
                                <p className="page-subtitle">Connect and chat with others</p>
                            </div>
                            <ContactsSidebar />
                        </aside>
                        {/* Main chat pane */}
                        <main className="flex-1 h-full flex flex-col min-h-0">
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
                <div className="page-container">
                    <div className="loading-state">
                        <div className="loading-content">
                            <h1 className="page-heading">Welcome to Messages</h1>
                            <p className="page-subtitle">Please sign in to continue</p>
                            <div className="pt-2 flex justify-center">
                                <WalletConnection />
                            </div>
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

