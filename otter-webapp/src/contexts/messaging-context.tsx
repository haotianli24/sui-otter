"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useWallets } from '@mysten/dapp-kit';
import { MessagingService, Channel, Message } from '@/lib/messaging-service';

interface MessagingContextType {
  messagingService: MessagingService | null;
  channels: Channel[];
  messages: Record<string, Message[]>;
  currentUser: string | null;
  isLoading: boolean;
  error: string | null;
  createChannel: (recipientAddress: string) => Promise<void>;
  sendMessage: (channelId: string, content: string) => Promise<void>;
  loadMessages: (channelId: string) => Promise<void>;
  refreshChannels: () => Promise<void>;
}

const MessagingContext = createContext<MessagingContextType | undefined>(undefined);

export function MessagingProvider({ children }: { children: React.ReactNode }) {
  // Hardcoded wallet for now
  const HARDCODED_WALLET = "0x5fd6818ea960ecf361a15ecb3134bda2600e4138f4a82b1939fdde41530e8a6d";
  
  const [messagingService, setMessagingService] = useState<MessagingService | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [currentUser, setCurrentUser] = useState<string | null>(HARDCODED_WALLET);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize messaging service with hardcoded wallet
  useEffect(() => {
    const userAddress = HARDCODED_WALLET;
    setCurrentUser(userAddress);
    
    // Create a signer object for the messaging service
    const signer = {
      toSuiAddress: () => userAddress,
      signAndExecuteTransaction: async (params: any) => {
        // This will be handled by the wallet
        return { digest: 'mock-digest' };
      },
      getAddress: () => userAddress
    };

    try {
      const service = new MessagingService(signer);
      setMessagingService(service);
      setError(null);
    } catch (err) {
      console.error('Failed to initialize messaging service:', err);
      setError('Failed to initialize messaging service');
    }
  }, []);

  // Load channels when messaging service is available
  useEffect(() => {
    if (messagingService && currentUser) {
      refreshChannels();
    }
  }, [messagingService, currentUser]);

  const refreshChannels = useCallback(async () => {
    if (!messagingService || !currentUser) return;

    setIsLoading(true);
    setError(null);

    try {
      const userChannels = await messagingService.getChannels(currentUser);
      setChannels(userChannels);
    } catch (err) {
      console.error('Failed to load channels:', err);
      setError('Failed to load channels');
    } finally {
      setIsLoading(false);
    }
  }, [messagingService, currentUser]);

  const createChannel = useCallback(async (recipientAddress: string) => {
    if (!messagingService) {
      throw new Error('Messaging service not initialized');
    }

    setIsLoading(true);
    setError(null);

    try {
      const signer = {
        toSuiAddress: () => HARDCODED_WALLET,
        signAndExecuteTransaction: async (params: any) => {
          // This will be handled by the wallet
          return { digest: 'mock-digest' };
        },
        getAddress: () => HARDCODED_WALLET
      };

      const { channelId } = await messagingService.createChannel(signer, recipientAddress);
      
      // Refresh channels to include the new one
      await refreshChannels();
    } catch (err) {
      console.error('Failed to create channel:', err);
      setError('Failed to create channel');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [messagingService, refreshChannels]);

  const sendMessage = useCallback(async (channelId: string, content: string) => {
    if (!messagingService) {
      throw new Error('Messaging service not initialized');
    }

    try {
      const signer = {
        toSuiAddress: () => HARDCODED_WALLET,
        signAndExecuteTransaction: async (params: any) => {
          // This will be handled by the wallet
          return { digest: 'mock-digest' };
        },
        getAddress: () => HARDCODED_WALLET
      };

      // For now, we'll add the message locally since we need proper memberCapId and encryptedKey
      const newMessage: Message = {
        id: `msg-${Date.now()}`,
        content,
        sender: HARDCODED_WALLET,
        timestamp: Date.now(),
        channelId
      };

      setMessages(prev => ({
        ...prev,
        [channelId]: [...(prev[channelId] || []), newMessage]
      }));

      // TODO: Implement actual message sending with proper SDK integration
      // await messagingService.sendMessage(signer, channelId, content, memberCapId, encryptedKey);
    } catch (err) {
      console.error('Failed to send message:', err);
      setError('Failed to send message');
      throw err;
    }
  }, [messagingService]);

  const loadMessages = useCallback(async (channelId: string) => {
    if (!messagingService || !currentUser) return;

    try {
      const channelMessages = await messagingService.getMessages(channelId, currentUser);
      setMessages(prev => ({
        ...prev,
        [channelId]: channelMessages
      }));
    } catch (err) {
      console.error('Failed to load messages:', err);
      setError('Failed to load messages');
    }
  }, [messagingService, currentUser]);

  const value: MessagingContextType = {
    messagingService,
    channels,
    messages,
    currentUser,
    isLoading,
    error,
    createChannel,
    sendMessage,
    loadMessages,
    refreshChannels
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
