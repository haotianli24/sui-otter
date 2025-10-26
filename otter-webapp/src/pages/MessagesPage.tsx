import { useCurrentAccount } from "@mysten/dapp-kit";
import { useState, useEffect } from "react";
import { isValidSuiObjectId } from "@mysten/sui/utils";
import { SessionKeyProvider } from "../providers/SessionKeyProvider";
import { MessagingClientProvider } from "../providers/MessagingClientProvider";
import { ErrorBoundary } from "../components/ErrorBoundary";

// We'll create simple versions of the components inline for now
import { CreateChannel } from "../components/messages/CreateChannel";
import { ChannelList } from "../components/messages/ChannelList";
import { Channel } from "../components/messages/Channel";
import { MessagingStatus } from "../components/messages/MessagingStatus";

function MessagesPageContent() {
    const currentAccount = useCurrentAccount();
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
        <div className="flex-1 overflow-auto p-6">
            <div className="max-w-5xl mx-auto space-y-6">
                {currentAccount ? (
                    channelId ? (
                        <Channel
                            channelId={channelId}
                            onBack={() => {
                                window.location.hash = '';
                                setChannelId(null);
                            }}
                        />
                    ) : (
                        <div className="space-y-6">
                            <MessagingStatus />
                            <CreateChannel />
                            <ChannelList />
                        </div>
                    )
                ) : (
                    <div className="flex items-center justify-center min-h-[400px]">
                        <div className="text-center">
                            <h2 className="text-2xl font-bold mb-4">Welcome to Messages</h2>
                            <p className="text-muted-foreground mb-6">Please connect your wallet to start messaging</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function MessagesPage() {
    return (
        <ErrorBoundary>
            <SessionKeyProvider>
                <MessagingClientProvider>
                    <MessagesPageContent />
                </MessagingClientProvider>
            </SessionKeyProvider>
        </ErrorBoundary>
    );
}
