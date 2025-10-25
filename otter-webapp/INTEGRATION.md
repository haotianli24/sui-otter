# Backend Integration Guide

This document maps UI features to backend implementation points.

## Authentication

### Current State
- Mock user: `currentUser` from `mock-data.ts`

### Integration Points

**Files to connect:**
- `/otter/src/app/api/enoki/derive/route.ts` - zkLogin address derivation
- `/otter/src/lib/supabase.ts` - Supabase client
- `/otter/src/app/providers.tsx` - Sui wallet provider

**Implementation:**
1. Add Enoki auth flow to login page (to be created)
2. Store authenticated user in context/state
3. Replace `currentUser` with real user data from Supabase

**Supabase Schema Needed:**
```sql
-- users table (already exists in /otter)
CREATE TABLE users (
  id TEXT PRIMARY KEY,        -- Sui address
  address TEXT NOT NULL,
  email TEXT,
  name TEXT,
  bio TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Messaging

### Current State
- Mock conversations and messages from `mock-data.ts`
- Local state management for new messages

### Integration Points

**Smart Contract:**
- `/otter/move/messaging/sources/messaging.move`
  - `create_channel(registry, recipient, ctx)` - Create DM channel
  - `send_message(channel, content, media_ref, clock, ctx)` - Send message
  - `send_crypto(channel, payment, ctx)` - Send crypto via /send command

**Implementation:**

1. **Fetch Conversations**
   - Query Sui events: `ChannelCreated`
   - Filter channels where user is `user1` or `user2`
   - Store in Supabase for fast lookup

2. **Fetch Messages**
   - Query Sui events: `MessageSent` for specific `channel_id`
   - Decrypt content using Seal (encryption library)
   - Fetch media from Walrus using `media_ref`

3. **Send Message**
   - Call `send_message` with encrypted content
   - Upload media to Walrus first, get reference
   - Emit event, update local state optimistically

4. **Send Crypto**
   - Parse `/send @user 10 SUI` command
   - Call `send_crypto` with coin object
   - Emit `CryptoSent` event

**Supabase Schema:**
```sql
-- Cache for channels (for fast UI)
CREATE TABLE channels (
  id TEXT PRIMARY KEY,
  user1 TEXT REFERENCES users(id),
  user2 TEXT REFERENCES users(id),
  encrypted BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Cache for messages
CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  channel_id TEXT REFERENCES channels(id),
  sender_id TEXT REFERENCES users(id),
  content TEXT,                -- Encrypted
  media_url TEXT,              -- Walrus URL
  type TEXT,                   -- 'text', 'trade', 'crypto'
  trade_data JSONB,
  crypto_data JSONB,
  timestamp TIMESTAMP DEFAULT NOW(),
  INDEX (channel_id, timestamp)
);
```

## Communities (Groups)

### Current State
- Mock communities and group conversations
- Static member lists

### Integration Points

**Smart Contract (To Be Created):**
- `community.move` (referenced in project notes, not yet implemented)
  - `create_community(name, description, price, type, ctx)`
  - `subscribe_to_community(community_id, payment, ctx)`
  - `post_to_community(community_id, content, ctx)`
  - `verify_token_holding(community_id, user, ctx)` - For token-gated

**Implementation:**

1. **Create Community** (Profile page "Create New")
   - Call `create_community` smart contract function
   - Store metadata in Supabase
   - Upload avatar to Walrus

2. **Subscribe to Community** (Discover page)
   - For paid: call `subscribe_to_community` with SUI payment
   - For token-gated: verify token balance first
   - For free: just add user to members list

3. **Fetch Communities** (Discover page)
   - Query Supabase communities table
   - Filter by type
   - Calculate P&L from trade history

4. **Group Messages**
   - Similar to DM but with multiple participants
   - Use shared channel object

**Supabase Schema:**
```sql
CREATE TABLE communities (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  avatar_url TEXT,
  owner_id TEXT REFERENCES users(id),
  type TEXT CHECK (type IN ('free', 'paid', 'token-gated')),
  price TEXT,                  -- e.g., "50 SUI/month"
  token_symbol TEXT,
  token_amount TEXT,
  member_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE community_members (
  community_id TEXT REFERENCES communities(id),
  user_id TEXT REFERENCES users(id),
  joined_at TIMESTAMP DEFAULT NOW(),
  subscription_expires TIMESTAMP,
  PRIMARY KEY (community_id, user_id)
);

CREATE TABLE community_messages (
  id TEXT PRIMARY KEY,
  community_id TEXT REFERENCES communities(id),
  sender_id TEXT REFERENCES users(id),
  content TEXT,
  type TEXT,
  trade_data JSONB,
  timestamp TIMESTAMP DEFAULT NOW(),
  INDEX (community_id, timestamp)
);
```

## Trade Sharing & Copy Trading

### Current State
- Mock trade messages in conversations
- "Copy Trade" button (non-functional)

### Integration Points

**Implementation:**

1. **Share Trade**
   - User posts transaction digest to chat
   - Backend fetches transaction details from Sui RPC
   - Parse Move calls to extract trade info (token, amount, price)
   - Display in formatted trade bubble

2. **Copy Trade**
   - Extract trade parameters from original transaction
   - Reconstruct transaction for current user
   - Sign and submit using user's wallet
   - Optionally: sponsor gas via Enoki (see `/otter/src/app/api/enoki/sponsor/route.ts`)

**Files to reference:**
- Transaction parsing: Use `@mysten/sui` SDK
- Transaction builder: `Transaction` class from SDK
- Gas sponsorship: `/otter/src/app/api/enoki/sponsor/route.ts`

## Transaction Explainer

### Current State
- Toggle switch in Settings (functional)
- Not applied to transaction display

### Integration Points

**Implementation:**

1. Detect transaction digest in message content
2. Fetch transaction details from Sui RPC
3. Parse and format in plain English:
   ```
   "Alice sent 500 SUI to buy DEEP tokens.
   Gas fee: 0.001 SUI.
   Result: Received 10,000 DEEP at $0.05 each."
   ```
4. Show explanation below transaction bubble if toggle is on

**Reference:**
- Example transaction explainer tool: https://airtable.com/appNFdPEyQecFhglH/shrZ3OvQ5wAAyIQQd/tblBcgbcf5UsCuuRP/viwJu1laK0zpj340T/reccTx6gyHtfAh66g

## Portfolio

### Current State
- Mock portfolio data in Profile page

### Integration Points

**Implementation:**

1. **Balance**
   - Fetch user's SUI balance from chain
   - Convert to USD using price oracle

2. **P&L Calculation**
   - Track user's trade history
   - Compare entry vs current prices
   - Aggregate across all positions

3. **Active Trades**
   - Query user's open positions
   - Can be stored in Supabase for faster access

**Supabase Schema:**
```sql
CREATE TABLE trades (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  tx_digest TEXT,
  action TEXT,               -- 'buy' or 'sell'
  token TEXT,
  amount NUMERIC,
  price NUMERIC,
  timestamp TIMESTAMP,
  status TEXT,               -- 'open' or 'closed'
  INDEX (user_id, timestamp)
);
```

## Real-time Updates

### Implementation

Use Supabase Realtime for live updates:

1. **New Messages**
   ```typescript
   supabase
     .channel('messages')
     .on('postgres_changes', 
       { event: 'INSERT', schema: 'public', table: 'messages' },
       (payload) => {
         // Update UI with new message
       }
     )
     .subscribe()
   ```

2. **Community Updates**
   - Similar pattern for community_messages table

## Media Upload (Walrus)

### Current State
- Attachment button in message input (non-functional)

### Integration Points

**Implementation:**

1. User selects file
2. Upload to Walrus storage
3. Get storage reference
4. Include reference in `send_message` call
5. Fetch from Walrus for display

**Walrus API:**
- Upload endpoint: TBD (per project spec)
- Storage references stored in message `media_ref` field

## Next Steps for Integration

### Phase 1: Auth & Users
1. Connect Enoki authentication
2. Fetch real user data from Supabase
3. Display authenticated user info in TopBar

### Phase 2: Messaging
1. Create/fetch channels from smart contract
2. Send/receive messages
3. Real-time updates via Supabase

### Phase 3: Communities
1. Deploy community smart contract
2. Implement create/join/leave flows
3. Community chat messages

### Phase 4: Trading Features
1. Transaction parsing and display
2. Copy trade functionality
3. Transaction explainer

### Phase 5: Advanced Features
1. Media uploads (Walrus)
2. Portfolio tracking
3. P&L calculations
4. Token-gated communities

