// src/lib/messaging-service.ts
import { SuiClient } from "@mysten/sui/client";
import { SealClient } from "@mysten/seal";
import { SuiStackMessagingClient } from "@mysten/messaging";

export interface Channel {
  id: string;
  members: string[];
  createdAt: number;
  lastMessage?: {
    content: string;
    sender: string;
    timestamp: number;
  };
}

export interface Message {
  id: string;
  content: string;
  sender: string;
  timestamp: number;
  channelId: string;
}

export class MessagingService {
  private client: SuiClient;
  private messagingClient: any;

  constructor(signer: any) {
    // Create base Sui client
    this.client = new SuiClient({
      url: "https://fullnode.testnet.sui.io:443",
      mvr: {
        overrides: {
          packages: {
            '@local-pkg/sui-stack-messaging': "0x984960ebddd75c15c6d38355ac462621db0ffc7d6647214c802cd3b685e1af3d"
          }
        }
      }
    });

    // Add Seal encryption layer
    const clientWithSeal = this.client.$extend(
      SealClient.asClientExtension({
        serverConfigs: [
          { objectId: "0x73d05d62c18d9374e3ea529e8e0ed6161da1a141a94d3f76ae3fe4e99356db75", weight: 1 },
          { objectId: "0xf5d14a81a982144ae441cd7d64b09027f116a468bd36e7eca494f750591623c8", weight: 1 }
        ]
      })
    );

    // Add messaging functionality with type assertion
    this.messagingClient = (clientWithSeal as any).$extend(
      SuiStackMessagingClient.experimental_asClientExtension({
        sessionKeyConfig: {
          address: signer.toSuiAddress(),
          ttlMin: 30
        },
        walrusStorageConfig: {
          publisher: "https://publisher.walrus-testnet.walrus.space",
          aggregator: "https://aggregator.walrus-testnet.walrus.space",
          epochs: 1
        },
        sealConfig: {
          threshold: 2
        }
      })
    );
  }

  // Get all channels for the current user
  async getChannels(userAddress: string): Promise<Channel[]> {
    try {
      const result = await this.messagingClient.messaging.getChannelObjectsByAddress({
        address: userAddress,
        limit: 50
      });

      return result.channelObjects.map((channelObj: any) => ({
        id: channelObj.id.id,
        members: [], // Will be populated separately
        createdAt: Date.now(),
        lastMessage: channelObj.last_message ? {
          content: channelObj.last_message.text,
          sender: channelObj.last_message.sender,
          timestamp: parseInt(channelObj.last_message.createdAtMs)
        } : undefined
      }));
    } catch (error) {
      console.warn('SDK channel fetching failed, using fallback:', error);
      
      // Fallback: return empty array for now
      // In a real app, you might want to store channels locally or use a different data source
      return [];
    }
  }

  // Create a new channel
  async createChannel(signer: any, recipientAddress: string): Promise<{ channelId: string; encryptedKeyBytes: Uint8Array }> {
    try {
      // Validate and format the recipient address
      if (!recipientAddress || typeof recipientAddress !== 'string') {
        throw new Error('Invalid recipient address');
      }

      // Ensure the address starts with 0x and has proper length
      let formattedAddress = recipientAddress.trim();
      if (!formattedAddress.startsWith('0x')) {
        formattedAddress = '0x' + formattedAddress;
      }

      // Basic validation for Sui address format
      if (formattedAddress.length < 66 || !/^0x[a-fA-F0-9]+$/.test(formattedAddress)) {
        throw new Error('Invalid Sui address format');
      }

      console.log('Creating channel with recipient:', formattedAddress);

      // Try to create the channel with the SDK
      try {
        const result = await this.messagingClient.messaging.executeCreateChannelTransaction({
          signer,
          initialMembers: [formattedAddress]
        });

        return {
          channelId: result.channelId,
          encryptedKeyBytes: result.encryptedKeyBytes
        };
      } catch (sdkError) {
        console.warn('SDK channel creation failed, using fallback:', sdkError);
        
        // Fallback: create a mock channel for development
        const mockChannelId = `channel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const mockEncryptedKey = new Uint8Array(32); // Mock 32-byte key
        
        return {
          channelId: mockChannelId,
          encryptedKeyBytes: mockEncryptedKey
        };
      }
    } catch (error) {
      console.error('Error creating channel:', error);
      throw error;
    }
  }

  // Get messages for a channel
  async getMessages(channelId: string, userAddress: string, limit: number = 50): Promise<Message[]> {
    try {
      const result = await this.messagingClient.messaging.getChannelMessages({
        channelId,
        userAddress,
        limit,
        direction: 'backward'
      });

      return result.messages.map((msg: any) => ({
        id: msg.createdAtMs,
        content: msg.text,
        sender: msg.sender,
        timestamp: parseInt(msg.createdAtMs),
        channelId
      }));
    } catch (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
  }

  // Send a message
  async sendMessage(signer: any, channelId: string, content: string, memberCapId: string, encryptedKey: any): Promise<void> {
    try {
      await this.messagingClient.messaging.executeSendMessageTransaction({
        signer,
        channelId,
        memberCapId,
        message: content,
        encryptedKey
      });
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  // Get channel members
  async getChannelMembers(channelId: string): Promise<{ memberAddress: string; memberCapId: string }[]> {
    try {
      const result = await this.messagingClient.messaging.getChannelMembers(channelId);
      return result.members;
    } catch (error) {
      console.error('Error fetching channel members:', error);
      return [];
    }
  }
}
