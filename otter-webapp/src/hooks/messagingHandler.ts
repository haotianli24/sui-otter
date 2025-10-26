import { useMessagingClient } from '../providers/MessagingClientProvider';
import { normalizeSuiAddress } from '@mysten/sui/utils';
import { useSessionKey } from '../providers/SessionKeyProvider';
import { useSignAndExecuteTransaction, useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { useState, useCallback, useEffect } from 'react';
import { Transaction } from '@mysten/sui/transactions';
import { DecryptedChannelObject, DecryptMessageResult, ChannelMessagesDecryptedRequest } from '@mysten/messaging';

export const useMessaging = () => {
  const messagingClient = useMessagingClient();
  const { sessionKey, isInitializing, error } = useSessionKey();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();

  // Channel state
  const [channels, setChannels] = useState<DecryptedChannelObject[]>([]);
  const [isCreatingChannel, setIsCreatingChannel] = useState(false);
  const [isFetchingChannels, setIsFetchingChannels] = useState(false);
  const [channelError, setChannelError] = useState<string | null>(null);

  // Current channel state
  const [currentChannel, setCurrentChannel] = useState<DecryptedChannelObject | null>(null);
  const [messages, setMessages] = useState<DecryptMessageResult[]>([]);
  const [isFetchingMessages, setIsFetchingMessages] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [messagesCursor, setMessagesCursor] = useState<bigint | null>(null);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);

  // Create channel function
  const createChannel = useCallback(async (recipientAddresses: string[]) => {

    if (!messagingClient || !currentAccount) {
      setChannelError('[createChannel] Messaging client or account not available');
      return null;
    }
  
    // ADD THIS CHECK
    if (!sessionKey) {
      setChannelError('[createChannel] Session key not available');
      console.error('Session key is missing or not initialized');
      return null;
    }
  
    // ADD THIS CHECK
    if (isInitializing) {
      setChannelError('[createChannel] Session key is still initializing');
      console.error('Wait for session key initialization to complete');
      return null;
    }
  
    setIsCreatingChannel(true);
    setChannelError(null);

    try {
      console.log('=== CREATE CHANNEL DEBUG ===');
      console.log('Session key present:', !!sessionKey);
      console.log('Messaging client type:', messagingClient.constructor.name);
      console.log('Creator address:', currentAccount.address);
      console.log('Recipient addresses:', recipientAddresses);
      
      // Validate inputs
      if (!Array.isArray(recipientAddresses) || recipientAddresses.length === 0) {
        throw new Error('recipientAddresses must be a non-empty array');
      }

      const flowParams = {
        creatorAddress: currentAccount.address,
        initialMemberAddresses: recipientAddresses,
      };
      
      console.log('Creating channel flow with params:', JSON.stringify(flowParams, null, 2));

      // Try-catch around createChannelFlow
      let flow;
      try {
        flow = messagingClient.createChannelFlow(flowParams);
        console.log('Channel flow created:', flow);
        console.log('Flow type:', typeof flow);
        console.log('Flow has build method:', typeof flow.build === 'function');
      } catch (flowError) {
        console.error('Error creating channel flow:', flowError);
        throw new Error(`Failed to create channel flow: ${flowError instanceof Error ? flowError.message : String(flowError)}`);
      }

      // Try-catch around build
      console.log('Building transaction...');
      let channelTx;
      try {
        channelTx = flow.build();
        console.log('Transaction built successfully');
      } catch (buildError) {
        console.error('Error building transaction:', buildError);
        console.error('Build error stack:', buildError instanceof Error ? buildError.stack : 'No stack');
        throw new Error(`Failed to build transaction: ${buildError instanceof Error ? buildError.message : String(buildError)}`);
      }

    // Rest of your code...
      console.log('Transaction built successfully');
      const { digest } = await signAndExecute({
        transaction: channelTx,
      });

      // Wait for transaction and get channel ID
      const { objectChanges } = await suiClient.waitForTransaction({
        digest,
        options: { showObjectChanges: true },
      });

      const createdChannel = objectChanges?.find(
        (change) => change.type === 'created' && change.objectType?.endsWith('::channel::Channel')
      );

      const channelId = (createdChannel as any)?.objectId;

      // Step 2: Get generated caps
      const { creatorMemberCap } = await flow.getGeneratedCaps({ digest });

      // Step 3: Generate and attach encryption key
      const attachKeyTx = await flow.generateAndAttachEncryptionKey({
        creatorMemberCap,
      });

      const { digest: finalDigest } = await signAndExecute({
        transaction: attachKeyTx,
      });

      // Wait for final transaction
      const { effects } = await suiClient.waitForTransaction({
        digest: finalDigest,
        options: { showEffects: true },
      });

      if (effects?.status.status !== 'success') {
        throw new Error('Transaction failed');
      }

      // Refresh channels list
      await fetchChannels();

      return { channelId };
    } catch (err) {
      const errorMsg = err instanceof Error ? `[createChannel] ${err.message}` : '[createChannel] Failed to create channel';
      setChannelError(errorMsg);
      console.error('Error creating channel:', err);
      return null;
    } finally {
      setIsCreatingChannel(false);
    }
  }, [messagingClient, currentAccount, signAndExecute, suiClient]);

  // Fetch channels function
  const fetchChannels = useCallback(async () => {
    if (!messagingClient || !currentAccount) {
      return;
    }

    setIsFetchingChannels(true);
    setChannelError(null);

    try {
      const response = await messagingClient.getChannelObjectsByAddress({
        address: currentAccount.address,
        limit: 10,
      });

      setChannels(response.channelObjects);
    } catch (err) {
      const errorMsg = err instanceof Error ? `[fetchChannels] ${err.message}` : '[fetchChannels] Failed to fetch channels';
      setChannelError(errorMsg);
      console.error('Error fetching channels:', err);
    } finally {
      setIsFetchingChannels(false);
    }
  }, [messagingClient, currentAccount]);

  // Get channel by ID
  const getChannelById = useCallback(async (channelId: string) => {
    if (!messagingClient || !currentAccount) {
      return null;
    }

    setChannelError(null);

    try {
      const response = await messagingClient.getChannelObjectsByChannelIds({
        channelIds: [channelId],
        userAddress: currentAccount.address,
      });

      if (response.length > 0) {
        setCurrentChannel(response[0]);
        return response[0];
      }
      return null;
    } catch (err) {
      const errorMsg = err instanceof Error ? `[getChannelById] ${err.message}` : '[getChannelById] Failed to fetch channel';
      setChannelError(errorMsg);
      console.error('Error fetching channel:', err);
      return null;
    }
  }, [messagingClient, currentAccount]);

  // Fetch messages for a channel
  const fetchMessages = useCallback(async (channelId: string, cursor: bigint | null = null) => {
    if (!messagingClient || !currentAccount) {
      return;
    }

    setIsFetchingMessages(true);
    setChannelError(null);

    try {
      const response = await messagingClient.getChannelMessages({
        channelId,
        userAddress: currentAccount.address,
        cursor,
        limit: 20,
        direction: 'backward',
      });

      if (cursor === null) {
        // First fetch, replace messages
        setMessages(response.messages);
      } else {
        // Pagination, append older messages
        setMessages(prev => [...response.messages, ...prev]);
      }

      setMessagesCursor(response.cursor);
      setHasMoreMessages(response.hasNextPage);
    } catch (err) {
      const errorMsg = err instanceof Error ? `[fetchMessages] ${err.message}` : '[fetchMessages] Failed to fetch messages';
      setChannelError(errorMsg);
      console.error('Error fetching messages:', err);
    } finally {
      setIsFetchingMessages(false);
    }
  }, [messagingClient, currentAccount]);

  // Get member cap for channel
  const getMemberCapForChannel = useCallback(async (channelId: string) => {
    if (!messagingClient || !currentAccount) {
      return null;
    }

    try {
      const memberships = await messagingClient.getChannelMemberships({
        address: currentAccount.address,
      });

      const membership = memberships.memberships.find(m => m.channel_id === channelId);
      return membership?.member_cap_id || null;
    } catch (err) {
      console.error('Error getting member cap:', err);
      return null;
    }
  }, [messagingClient, currentAccount]);

  // Get encrypted key for channel
  const getEncryptedKeyForChannel = useCallback(async (channelId: string) => {
    if (!currentChannel || currentChannel.id.id !== channelId) {
      const channel = await getChannelById(channelId);
      if (!channel) return null;
    }

    const channel = currentChannel || (await getChannelById(channelId));
    if (!channel) return null;

    const encryptedKeyBytes = channel.encryption_key_history.latest;
    const keyVersion = channel.encryption_key_history.latest_version;

    return {
      $kind: 'Encrypted' as const,
      encryptedBytes: new Uint8Array(encryptedKeyBytes),
      version: keyVersion,
    } as ChannelMessagesDecryptedRequest['encryptedKey'];
  }, [currentChannel, getChannelById]);

  // Send message function
  const sendMessage = useCallback(async (channelId: string, message: string) => {
    if (!messagingClient || !currentAccount) {
      setChannelError('[sendMessage] Messaging client or account not available');
      return null;
    }

    setIsSendingMessage(true);
    setChannelError(null);

    try {
      // Get member cap ID
      const memberCapId = await getMemberCapForChannel(channelId);
      if (!memberCapId) {
        throw new Error('No member cap found for channel');
      }

      // Get encrypted key
      const encryptedKey = await getEncryptedKeyForChannel(channelId);
      if (!encryptedKey) {
        throw new Error('No encrypted key found for channel');
      }

      // Create and execute send message transaction
      const tx = new Transaction();
      const sendMessageTxBuilder = await messagingClient.sendMessage(
        channelId,
        memberCapId,
        currentAccount.address,
        message,
        encryptedKey,
      );
      await sendMessageTxBuilder(tx);

      const { digest } = await signAndExecute({ transaction: tx });

      // Wait for transaction
      await suiClient.waitForTransaction({
        digest,
        options: { showEffects: true },
      });

      // Refresh messages to show the new one
      await fetchMessages(channelId);

      return { digest };
    } catch (err) {
      const errorMsg = err instanceof Error ? `[sendMessage] ${err.message}` : '[sendMessage] Failed to send message';
      setChannelError(errorMsg);
      console.error('Error sending message:', err);
      return null;
    } finally {
      setIsSendingMessage(false);
    }
  }, [messagingClient, currentAccount, signAndExecute, suiClient, getMemberCapForChannel, getEncryptedKeyForChannel, fetchMessages]);

  // Fetch channels when client is ready
  useEffect(() => {
    if (messagingClient && currentAccount) {
      fetchChannels();
      // Set up auto-refresh every 10 seconds
      const interval = setInterval(fetchChannels, 10000);
      return () => clearInterval(interval);
    }
  }, [messagingClient, currentAccount, fetchChannels]);

  return {
    client: messagingClient,
    sessionKey,
    isInitializing,
    error,
    isReady: !!messagingClient && !!sessionKey,

    // Channel functions and state
    channels,
    createChannel,
    fetchChannels,
    isCreatingChannel,
    isFetchingChannels,
    channelError,

    // Current channel functions and state
    currentChannel,
    messages,
    getChannelById,
    fetchMessages,
    sendMessage,
    isFetchingMessages,
    isSendingMessage,
    messagesCursor,
    hasMoreMessages,
  };
};