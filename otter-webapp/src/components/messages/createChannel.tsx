import { useState } from 'react';
import { useMessaging } from '@/hooks/messagingHandler';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { isValidSuiAddress } from '@mysten/sui/utils';
import { useSessionKey } from '@/providers/SessionKeyProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';

interface CreateChannelProps {
  onInteraction?: () => void;
}

export function CreateChannel({ onInteraction }: CreateChannelProps) {
  const { createChannel, isCreatingChannel, channelError, isReady } = useMessaging();
  const { sessionKey, isInitializing, initializeManually } = useSessionKey();
  const currentAccount = useCurrentAccount();
  const [isOpen, setIsOpen] = useState(false);
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
      setSuccessMessage(`Channel created successfully!`);
      setRecipientAddresses(''); // Clear input on success

      // Track interaction for feedback
      if (onInteraction) {
        onInteraction();
      }

      // Close dialog after a short delay
      setTimeout(() => {
        setIsOpen(false);
        setSuccessMessage(null);
      }, 2000);
    } else if (channelError) {
      // Track channel creation error
      console.error('Error creating channel:', channelError);
    }
  };

  return (
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
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="recipients" className="text-sm font-medium">
              Recipient Wallet Address(es)
            </label>
            <Input
              id="recipients"
              placeholder="0x... (or multiple separated by commas)"
              value={recipientAddresses}
              onChange={(e) => {
                setRecipientAddresses(e.target.value);
                setValidationError(null);
              }}
              disabled={!isReady || isCreatingChannel}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Enter one or more Sui wallet addresses separated by commas
            </p>
          </div>

          {validationError && (
            <p className="text-sm text-destructive">
              {validationError}
            </p>
          )}

          {channelError && (
            <p className="text-sm text-destructive">
              Error: {channelError}
            </p>
          )}

          {successMessage && (
            <p className="text-sm text-green-600">
              {successMessage}
            </p>
          )}

          {!sessionKey && !isInitializing && currentAccount && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground mb-2">
                You need to initialize a session key to use encrypted messaging.
              </p>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={initializeManually}
                disabled={isInitializing}
              >
                {isInitializing ? 'Initializing...' : 'Initialize Session Key'}
              </Button>
            </div>
          )}

          {!isReady && sessionKey && (
            <p className="text-xs text-muted-foreground">
              Waiting for messaging client to initialize...
            </p>
          )}

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isCreatingChannel}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isReady || isCreatingChannel || !recipientAddresses.trim()}
            >
              {isCreatingChannel ? 'Creating...' : 'Create Channel'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}