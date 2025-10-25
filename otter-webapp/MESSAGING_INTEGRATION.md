# Direct Messages Integration with Sui Messaging SDK

This document describes the integration of the Sui Stack Messaging SDK with the Otter webapp for direct messaging functionality.

## Overview

The direct messages feature has been integrated with real blockchain data using the Sui Stack Messaging SDK. Users can now:

1. **Connect their Sui wallet** to access messaging features
2. **View existing 1-on-1 channels** from the blockchain
3. **Create new message channels** by entering a recipient's wallet address
4. **Send and receive encrypted messages** through the blockchain

## Architecture

### Components

- **MessagingService** (`src/lib/messaging-service.ts`): Core service that handles SDK integration
- **MessagingContext** (`src/contexts/messaging-context.tsx`): React context for state management
- **BlockchainConversationList** (`src/components/messages/blockchain-conversation-list.tsx`): Displays channels from blockchain
- **BlockchainMessageBubble** (`src/components/messages/blockchain-message-bubble.tsx`): Renders individual messages
- **EmptyMessages** (`src/components/messages/empty-messages.tsx`): Empty state with channel creation
- **WalletConnection** (`src/components/wallet-connection.tsx`): Wallet connection component

### Key Features

1. **Wallet Integration**: Uses Sui dApp Kit for wallet connection
2. **Real-time Data**: Fetches actual channels and messages from the blockchain
3. **Channel Creation**: Users can create new channels by entering recipient addresses
4. **Message Sending**: Sends encrypted messages through the Sui messaging SDK
5. **Empty State**: Graceful handling when no channels exist

## Usage

### Prerequisites

1. **Wallet Connection**: Users must connect a Sui wallet
2. **Network**: Currently configured for Sui testnet
3. **Dependencies**: All required Sui packages are installed

### User Flow

1. **Connect Wallet**: Click the wallet connection button in the top bar
2. **View Channels**: Existing 1-on-1 channels are automatically loaded
3. **Create Channel**: If no channels exist, click "Create New Message" and enter a recipient address
4. **Send Messages**: Select a channel and type messages in the input field

## Technical Details

### SDK Configuration

The messaging service is configured with:
- **Network**: Sui testnet
- **Seal Encryption**: Configured with testnet servers
- **Walrus Storage**: For message attachments
- **Session Keys**: Automatic management with 30-minute TTL

### Error Handling

- **Wallet Not Connected**: Shows connection prompt
- **No Channels**: Shows empty state with creation option
- **SDK Errors**: Graceful fallbacks with error messages
- **Network Issues**: Loading states and retry mechanisms

### Security

- **End-to-End Encryption**: All messages are encrypted using Seal
- **Decentralized Storage**: Attachments stored on Walrus
- **Session Management**: Automatic key rotation and management

## Future Enhancements

1. **Real-time Updates**: WebSocket integration for live message updates
2. **Message History**: Pagination for large message histories
3. **File Attachments**: Support for media and file sharing
4. **Group Messages**: Multi-participant channel support
5. **Message Search**: Full-text search across conversations

## Troubleshooting

### Common Issues

1. **"Wallet not connected"**: Ensure wallet is connected via the top bar
2. **"Failed to load channels"**: Check network connection and wallet status
3. **"Failed to create channel"**: Verify recipient address is valid
4. **"Failed to send message"**: Check wallet balance for gas fees

### Debug Information

Enable browser console logging to see detailed error messages and SDK interactions.

## Dependencies

- `@mysten/sui`: Sui client and utilities
- `@mysten/dapp-kit`: Wallet integration
- `@mysten/seal`: End-to-end encryption
- `@mysten/messaging`: Messaging SDK
- `@tanstack/react-query`: Data fetching and caching
