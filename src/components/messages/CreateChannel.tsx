import { useState } from 'react';
import { useMessaging } from '../../hooks/useMessaging';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { isValidSuiAddress } from '@mysten/sui/utils';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

export function CreateChannel() {
    const { createChannel, isCreatingChannel, channelError, isReady } = useMessaging();
    const currentAccount = useCurrentAccount();
    const [recipientAddresses, setRecipientAddresses] = useState('');
    const [validationError, setValidationError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setValidationError(null);
        setSuccessMessage(null);

        // Parse and validate addresses
        if (!recipientAddresses.trim()) {
            setValidationError('Please enter at least one recipient address');
            return;
        }

        const addresses = recipientAddresses
            .split(',')
            .map(addr => addr.trim())
            .filter(addr => addr.length > 0);

        if (addresses.length === 0) {
            setValidationError('Please enter at least one recipient address');
            return;
        }

        // Check for duplicate addresses in the input
        const uniqueAddresses = [...new Set(addresses)];
        if (uniqueAddresses.length !== addresses.length) {
            setValidationError('Duplicate addresses detected. Please enter each address only once.');
            return;
        }

        // Check if user is trying to add their own address
        if (currentAccount && addresses.some(addr => addr.toLowerCase() === currentAccount.address.toLowerCase())) {
            setValidationError('You cannot add your own connected wallet address. You will be automatically included in the channel.');
            return;
        }

        // Validate each address
        const invalidAddresses = addresses.filter(addr => !isValidSuiAddress(addr));
        if (invalidAddresses.length > 0) {
            setValidationError(`Invalid Sui address(es): ${invalidAddresses.join(', ')}`);
            return;
        }

        // Create channel
        const result = await createChannel(addresses);

        if (result?.channelId) {
            setSuccessMessage(`Channel created successfully! ID: ${result.channelId.slice(0, 10)}...`);
            setRecipientAddresses(''); // Clear input on success

            // Clear success message after 5 seconds
            setTimeout(() => setSuccessMessage(null), 5000);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Create New Channel</CardTitle>
                <CardDescription>
                    Enter one or more Sui addresses separated by commas to create a private messaging channel.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Input
                            placeholder="Enter Sui addresses (0x..., 0x..., ...)"
                            value={recipientAddresses}
                            onChange={(e) => {
                                setRecipientAddresses(e.target.value);
                                setValidationError(null);
                            }}
                            disabled={!isReady || isCreatingChannel}
                            className="w-full"
                        />
                    </div>

                    {validationError && (
                        <p className="text-sm text-destructive/70">{validationError}</p>
                    )}

                    {channelError && (
                        <p className="text-sm text-destructive/70">Error: {channelError}</p>
                    )}

                    {successMessage && (
                        <p className="text-sm text-foreground">{successMessage}</p>
                    )}

                    <Button
                        type="submit"
                        disabled={!isReady || isCreatingChannel}
                        className="w-full"
                    >
                        {isCreatingChannel ? 'Creating Channel...' : 'Create Channel'}
                    </Button>

                    {!isReady && (
                        <p className="text-sm text-muted-foreground">
                            Waiting for messaging client to initialize...
                        </p>
                    )}
                </form>
            </CardContent>
        </Card>
    );
}

