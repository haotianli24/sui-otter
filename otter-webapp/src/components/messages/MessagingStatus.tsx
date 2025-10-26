import { useMessaging } from '../../hooks/useMessaging';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { useSessionKey } from '../../providers/SessionKeyProvider';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';

export function MessagingStatus() {
    const currentAccount = useCurrentAccount();
    const { client, sessionKey, isInitializing, error, isReady } = useMessaging();
    const { initializeManually } = useSessionKey();

    return (
        <Card>
            <CardHeader>
                <CardTitle>Messaging SDK Status</CardTitle>
                <CardDescription>End-to-end encrypted messaging powered by Sui</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="text-sm">Current Account:</span>
                        <Badge variant={currentAccount ? 'default' : 'secondary'}>
                            {currentAccount?.address ?
                                `${currentAccount.address.slice(0, 6)}...${currentAccount.address.slice(-4)}` :
                                'Not connected'}
                        </Badge>
                    </div>

                    <div className="flex justify-between items-center">
                        <span className="text-sm">Session Key:</span>
                        <Badge variant={sessionKey ? 'default' : isInitializing ? 'outline' : 'secondary'}>
                            {isInitializing ? 'Initializing...' : sessionKey ? 'Active' : 'Not initialized'}
                        </Badge>
                    </div>

                    <div className="flex justify-between items-center">
                        <span className="text-sm">Messaging Client:</span>
                        <Badge variant={client ? 'default' : 'secondary'}>
                            {client ? 'Ready' : 'Not initialized'}
                        </Badge>
                    </div>

                    <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold">Overall Status:</span>
                        <Badge variant={isReady ? 'default' : isInitializing ? 'outline' : 'destructive'}>
                            {isReady ? 'Ready to use' : isInitializing ? 'Setting up...' : 'Not ready'}
                        </Badge>
                    </div>
                </div>

                {error && (
                    <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                        <p className="text-sm text-destructive">Error: {error.message}</p>
                    </div>
                )}

                {currentAccount && !sessionKey && !isInitializing && (
                    <div className="mt-4 space-y-3 p-4 bg-muted rounded-md">
                        <p className="text-sm text-muted-foreground">
                            The SDK uses Seal for encrypting messages. The Seal SDK requires a session key,
                            which contains a signature from your account and allows the app to retrieve Seal decryption keys
                            for a limited time (30 minutes) without requiring repeated confirmations for each message.
                        </p>
                        <Button
                            onClick={initializeManually}
                            variant="default"
                            className="w-full"
                        >
                            Sign Session Key
                        </Button>
                    </div>
                )}

                {isReady && (
                    <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-md">
                        <p className="text-sm text-green-700 dark:text-green-400">
                            ✓ Messaging client is ready! You can now use it to send and receive messages.
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

