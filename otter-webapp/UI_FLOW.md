# Messages Page UI Flow

## Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Messages Page (Root)                      │
│  - Wrapped in ErrorBoundary → SessionKeyProvider →          │
│    MessagingClientProvider                                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ├─── No Wallet Connected
                              │    └─→ Show: "Please connect your wallet"
                              │
                              └─── Wallet Connected
                                   │
                                   ├─── Channel ID in URL hash
                                   │    └─→ Show: Channel View
                                   │         ┌──────────────────────────┐
                                   │         │ [← Back] Channel Details │
                                   │         ├──────────────────────────┤
                                   │         │ Message 1 (them)         │
                                   │         │         Message 2 (you)  │
                                   │         │ Message 3 (them)         │
                                   │         ├──────────────────────────┤
                                   │         │ [Type message...] [Send] │
                                   │         └──────────────────────────┘
                                   │
                                   └─── No Channel ID
                                        └─→ Show: Main View
                                             ┌────────────────────────┐
                                             │  Messaging SDK Status  │
                                             │  • Account: Connected  │
                                             │  • Session: Active     │
                                             │  • Client: Ready ✓     │
                                             └────────────────────────┘
                                             ┌────────────────────────┐
                                             │  Create New Channel    │
                                             │  [Enter addresses...]  │
                                             │  [Create Channel]      │
                                             └────────────────────────┘
                                             ┌────────────────────────┐
                                             │  Your Channels         │
                                             │  ┌──────────────────┐ │
                                             │  │ Channel #1       │ │
                                             │  │ Last: "Hello..." │ │
                                             │  └──────────────────┘ │
                                             │  ┌──────────────────┐ │
                                             │  │ Channel #2       │ │
                                             │  │ Last: "Hi..."    │ │
                                             │  └──────────────────┘ │
                                             └────────────────────────┘
```

## State Transitions

### 1. Initial Load (No Wallet)
```
User arrives → No wallet connected → Shows welcome screen
```

### 2. Wallet Connection
```
User connects wallet → Shows MessagingStatus card
                     → Session key not initialized
                     → Shows "Sign Session Key" button
```

### 3. Session Key Initialization
```
User clicks "Sign Session Key" → Wallet prompts for signature
                               → User signs
                               → Session key initialized
                               → Status shows "Ready ✓"
```

### 4. Creating First Channel
```
Ready state → CreateChannel form visible
           → User enters address(es)
           → Clicks "Create Channel"
           → 2 wallet transactions required
           → Channel created
           → Appears in ChannelList
```

### 5. Viewing Channel
```
ChannelList → User clicks channel → Hash updates (#channelId)
                                  → Channel component loads
                                  → Fetches messages
                                  → Shows message history
```

### 6. Sending Message
```
Channel view → User types message → Clicks Send
                                 → Wallet transaction
                                 → Message appears
                                 → Auto-refreshes
```

## Component Hierarchy

```
MessagesPage
├─ ErrorBoundary
│  └─ SessionKeyProvider
│     └─ MessagingClientProvider
│        └─ MessagesPageContent
│           │
│           ├─ No Account Branch
│           │  └─ Welcome message
│           │
│           ├─ Channel View Branch (has hash)
│           │  └─ Channel
│           │     ├─ Header (back button, channel info)
│           │     ├─ Messages List
│           │     │  ├─ Load More button
│           │     │  ├─ Message bubbles
│           │     │  └─ Auto-scroll ref
│           │     └─ Input Form
│           │        ├─ Text input
│           │        └─ Send button
│           │
│           └─ Main View Branch (no hash)
│              ├─ MessagingStatus
│              │  ├─ Status badges
│              │  ├─ Error display
│              │  └─ Sign button (if needed)
│              ├─ CreateChannel
│              │  ├─ Address input
│              │  ├─ Validation
│              │  └─ Create button
│              └─ ChannelList
│                 ├─ Refresh button
│                 ├─ Channel items
│                 │  ├─ Channel ID
│                 │  ├─ Metadata
│                 │  └─ Last message
│                 └─ Auto-refresh timer
```

## Key UI Elements

### MessagingStatus Card
- **Purpose**: Show system readiness
- **States**: 
  - Not ready (red badge)
  - Initializing (yellow badge)
  - Ready (green badge)
- **Actions**: Sign Session Key button

### CreateChannel Card
- **Purpose**: Create new encrypted channels
- **Input**: Comma-separated Sui addresses
- **Validation**: 
  - Valid Sui address format
  - No duplicates
  - No self-addressing
- **Feedback**: Success/error messages

### ChannelList Card
- **Purpose**: Browse all user channels
- **Display**: 
  - Channel ID (truncated)
  - Message count
  - Member count
  - Last message preview
  - Timestamp
- **Interaction**: Click to open
- **Auto-update**: Every 10 seconds

### Channel View Card
- **Purpose**: Full message interface
- **Layout**:
  - Header with back button
  - Scrollable message area
  - Fixed input at bottom
- **Features**:
  - Load more (pagination)
  - Auto-scroll to new messages
  - Differentiate current user vs others
  - Real-time updates

## URL Structure

```
Main view:     /messages
Channel view:  /messages#0xchannelid123...
```

Hash-based routing keeps it simple - no need for React Router nested routes.

## Styling Approach

- **Framework**: Tailwind CSS
- **Components**: shadcn/ui components (Card, Button, Input, Badge)
- **Theme**: Dark mode by default (from Radix Theme wrapper)
- **Responsive**: Mobile-friendly layouts

## Important Notes

1. **Session Key Duration**: 30 minutes - needs re-signing after expiry
2. **Auto-Refresh**: Channels and messages refresh every 10 seconds
3. **Transaction Flow**: Creating channels requires 2 wallet transactions
4. **Message Encryption**: All messages are end-to-end encrypted via Seal
5. **Hash Routing**: Simple and effective for single-channel viewing

