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
  const channels: Channel[] = sdk.channels.map((channel: DecryptedChannelObject) => {
    // Debug logging to see the actual structure
    console.log('MessagingContext channel conversion:', {
      channelId: channel.id.id,
      memberPermissions: channel.auth.member_permissions,
      contents: channel.auth.member_permissions.contents,
      lastMessage: channel.last_message
    });
    
    // Extract members from member permissions - the structure might be different
    let members: string[] = [];
    if (channel.auth.member_permissions.contents) {
      // Try different ways to extract member addresses
      members = channel.auth.member_permissions.contents.map((perm: any) => {
        // The perm might have different structures, let's try multiple approaches
        if (typeof perm === 'string') return perm;
        if (perm.key) return perm.key;
        if (perm.address) return perm.address;
        if (perm.member) return perm.member;
        return String(perm);
      });
    }
    
    // If we can't get members from permissions, try to infer from last message
    if (members.length === 0 && channel.last_message) {
      // For now, we'll let the component handle this with the fallback logic
      members = [channel.last_message.sender];
    }
    
    return {
      id: channel.id.id,
      members,
      createdAt: Number(channel.created_at_ms),
      lastMessage: channel.last_message ? {
        content: channel.last_message.text,
        sender: channel.last_message.sender,
        timestamp: Number(channel.last_message.createdAtMs),
      } : undefined,
    };
  });

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
      // For now, skip auto-refresh logic to avoid type errors
      // TODO: Implement proper session expiry checking when SessionKey type is clarified
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
