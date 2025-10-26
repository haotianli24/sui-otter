import React, { createContext, useContext, useEffect } from 'react';
import { useMessaging as useMessagingHook } from '@/hooks/useMessaging';
import { useSessionKey } from '@/providers/SessionKeyProvider';
import { DecryptedChannelObject, DecryptMessageResult } from '@mysten/messaging';

// Legacy interface for backwards compatibility with existing components
interface Message {
  id: string;
  content: string;
  sender: string;
  timestamp: number;
  channelId: string;
}

interface Channel {
  id: string;
  members: string[];
  createdAt: number;
  lastMessage?: {
    content: string;
    sender: string;
    timestamp: number;
  };
}

interface MessagingContextType {
  channels: Channel[];
  messages: Record<string, Message[]>;
  currentUser: string | null;
  isLoading: boolean;
  error: string | null;
  createChannel: (recipientAddress: string) => Promise<void>;
  sendMessage: (channelId: string, content: string) => Promise<void>;
  loadMessages: (channelId: string) => Promise<void>;
  refreshChannels: () => Promise<void>;
  // New SDK-specific properties
  isReady: boolean;
  initializeSession: () => Promise<void>;
  isInitializing: boolean;
  rawChannels: DecryptedChannelObject[];
  rawMessages: DecryptMessageResult[];
}

const MessagingContext = createContext<MessagingContextType | undefined>(undefined);

export function MessagingProvider({ children }: { children: React.ReactNode }) {
  const sdk = useMessagingHook();
  const { initializeManually, isInitializing, sessionKey } = useSessionKey();

  // Convert SDK channels to legacy format
  const channels: Channel[] = sdk.channels.map((channel: DecryptedChannelObject) => ({
    id: channel.id.id,
    members: channel.auth.member_permissions.contents.map((perm: { key: string }) => perm.key),
    createdAt: Number(channel.created_at_ms),
    lastMessage: channel.last_message ? {
      content: channel.last_message.text,
      sender: channel.last_message.sender,
      timestamp: Number(channel.last_message.createdAtMs),
    } : undefined,
  }));

  // Convert SDK messages to legacy format
  const messagesRecord: Record<string, Message[]> = {};
  if (sdk.currentChannel) {
    messagesRecord[sdk.currentChannel.id.id] = sdk.messages.map((msg: DecryptMessageResult) => ({
      id: String(msg.createdAtMs),
      content: msg.text,
      sender: msg.sender,
      timestamp: Number(msg.createdAtMs),
      channelId: sdk.currentChannel!.id.id,
    }));
  }

  const createChannel = async (recipientAddress: string) => {
    const result = await sdk.createChannel([recipientAddress]);
    if (!result) {
      throw new Error(sdk.channelError || 'Failed to create channel');
    }
  };

  const sendMessage = async (channelId: string, content: string) => {
    const result = await sdk.sendMessage(channelId, content);
    if (!result) {
      throw new Error(sdk.channelError || 'Failed to send message');
    }
  };

  const loadMessages = async (channelId: string) => {
    await sdk.getChannelById(channelId);
    await sdk.fetchMessages(channelId);
  };

  const refreshChannels = async () => {
    await sdk.fetchChannels();
  };

  // Check if session needs refresh when component mounts or session changes
  useEffect(() => {
    if (sessionKey && !isInitializing) {
      // Check if session is close to expiry (within 5 minutes)
      const now = Date.now();
      const creationTime = sessionKey.creationTimeMs;
      const ttlMs = sessionKey.ttlMin * 60 * 1000;
      const refreshTime = creationTime + ttlMs - (5 * 60 * 1000); // 5 minutes before expiry

      if (now >= refreshTime) {
        console.log('Session close to expiry, refreshing automatically...');
        initializeManually().catch(error => {
          console.error('Failed to auto-refresh session:', error);
        });
      }
    }
  }, [sessionKey, isInitializing, initializeManually]);

  const value: MessagingContextType = {
    channels,
    messages: messagesRecord,
    currentUser: null, // Not needed with SDK
    isLoading: sdk.isFetchingChannels, // Only show loading for channel fetching, not message fetching
    error: sdk.channelError,
    createChannel,
    sendMessage,
    loadMessages,
    refreshChannels,
    // New SDK-specific
    isReady: sdk.isReady,
    initializeSession: initializeManually,
    isInitializing,
    rawChannels: sdk.channels,
    rawMessages: sdk.messages,
  };

  return (
    <MessagingContext.Provider value={value}>
      {children}
    </MessagingContext.Provider>
  );
}

export function useMessaging() {
  const context = useContext(MessagingContext);
  if (context === undefined) {
    throw new Error('useMessaging must be used within a MessagingProvider');
  }
  return context;
}
