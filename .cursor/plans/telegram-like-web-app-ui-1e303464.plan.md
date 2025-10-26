<!-- 1e303464-ae19-46f5-9139-e92179c9af0d 4e30fb5c-e66a-4bc6-b51f-dbe1c15efad2 -->
# Stream Activity Page Implementation

## Overview

Create a new top-level navigation page that shows a real-time stream of blockchain transactions for any Sui address, with AI explanations on demand and enhanced transaction metadata.

## Implementation Steps

### 1. Add Stream Navigation Item

**File:** `otter-webapp/src/components/layout/sidebar.tsx`

- Add "Stream" to navItems array between "Groups" and "Discover"
- Import Activity icon from lucide-react
- Icon: Activity, href: "/stream"

### 2. Create API Route for Address Transactions

**File:** `otter-webapp/src/app/api/address-activity/route.ts` (new)

- Accept POST with { address: string, limit?: number }
- Use SuiClient.queryTransactionBlocks with filter: { FromAddress: address } or { ToAddress: address }
- Return array of transaction digests with timestamps
- Include pagination support (cursor-based)
- Handle errors gracefully

### 3. Enhance Transaction Parser with Protocol Names

**File:** `otter-webapp/src/app/api/transaction-explorer/route.ts`

- Expand KNOWN_PROTOCOLS registry with more DEXs, validators, CEXs
- Add KNOWN_ADDRESSES mapping for validators and CEX addresses
- Add helper function to resolve address to human-readable name
- Include this metadata in TransactionDetails response

### 4. Create Activity List Component

**File:** `otter-webapp/src/components/stream/activity-list.tsx` (new)

- Display transactions as compact list items
- Show: timestamp, transaction type icon, brief description, participants
- Each item has an "Explain with AI" button
- Clicking item expands to show full transaction details
- Use virtualization for performance (react-window or similar)

### 5. Create Activity Item Component  

**File:** `otter-webapp/src/components/stream/activity-item.tsx` (new)

- Compact view by default: timestamp, type badge, summary line
- Expandable to show full transaction operations
- "Explain" button triggers AI explanation modal/accordion
- Link to SuiScan explorer
- Copy transaction hash button
- Use existing TransactionEmbed component for consistency

### 6. Create AI Explanation Modal

**File:** `otter-webapp/src/components/stream/ai-explanation-modal.tsx` (new)

- Modal/dialog showing AI explanation
- Include "View on Explorer" button linking to SuiScan
- Include "Show Raw Transaction" button that displays parsed transaction data
- Use existing gemini-service.ts for explanations
- Handle loading and error states

### 7. Create Stream Page

**File:** `otter-webapp/src/app/stream/page.tsx` (new)

- Address input field with default mock address
- Manual refresh button
- Auto-polling every 30 seconds for new transactions
- Display "X new activities" badge when updates detected
- Activity filter dropdown (All, Transfers, Swaps, NFTs, etc.)
- Time range selector (Last hour, 24h, 7 days, All)
- Use ActivityList component to display transactions
- Loading skeleton while fetching
- Empty state when no transactions

### 8. Add Polling Hook

**File:** `otter-webapp/src/hooks/use-transaction-polling.ts` (new)

- Custom hook for polling address activity
- Configurable interval (default 30s)
- Detect new transactions and trigger notification
- Return { activities, isLoading, error, refresh, newCount }
- Auto-pause when tab not visible (document.visibilityState)

### 9. Update Gemini Service Context

**File:** `otter-webapp/src/lib/gemini-service.ts`

- Modify prompt to include protocol names and known addresses
- Add validator/CEX context when available
- Make explanations more specific using enhanced metadata

### 10. Add Protocol & Address Registry

**File:** `otter-webapp/src/lib/protocol-registry.ts` (new)

- Comprehensive list of known protocols (DEXs, lending, NFT marketplaces)
- Known validator addresses with names
- Known CEX addresses (Binance, Coinbase, etc.)
- Helper functions to resolve addresses to names
- This will be imported by transaction-explorer API

## Technical Details

### Sui RPC Query for Address Activity

```typescript
const txs = await client.queryTransactionBlocks({
  filter: {
    FromAddress: address, // or ToAddress, or both with OR
  },
  options: {
    showInput: true,
    showEffects: true,
    showEvents: true,
    showObjectChanges: true,
    showBalanceChanges: true,
  },
  limit: 50,
  order: 'descending',
});
```

### Auto-Polling Strategy

- Use setInterval with 30-second interval
- Check latest transaction digest against previous
- Show badge with new count
- Clear interval on unmount
- Pause when tab hidden

### Activity Item States

1. Collapsed: timestamp + one-line summary
2. Expanded: full operation list, participants, gas
3. AI Explaining: show loading spinner in button
4. AI Explained: show explanation in accordion/modal

## Files to Create

- `/app/stream/page.tsx`
- `/app/api/address-activity/route.ts`
- `/components/stream/activity-list.tsx`
- `/components/stream/activity-item.tsx`
- `/components/stream/ai-explanation-modal.tsx`
- `/hooks/use-transaction-polling.ts`
- `/lib/protocol-registry.ts`

## Files to Modify

- `/components/layout/sidebar.tsx` - add Stream nav item
- `/app/api/transaction-explorer/route.ts` - enhance with protocol names
- `/lib/gemini-service.ts` - add protocol context to prompts

## Mock Data Approach

- Use a default Sui address with known activity for demo
- Allow user to input their own address
- Gracefully handle addresses with no activity

### To-dos

- [ ] Create /otter-webapp/ folder with Next.js scaffold, Tailwind, and theme system
- [ ] Configure Supabase green colors, Open Sans font, and sharp UI styling
- [ ] Build navigation shell (sidebar, topbar, responsive layout)
- [ ] Create Direct Messages page with conversation list and chat view (mock data)
- [ ] Create Group Chat page with member sidebar and varied group types (mock data)
- [ ] Create Discover page with community cards grid and filters (mock data)
- [ ] Create ProfilCreate Settings Add message interactions, copy trade modals, and navigation flowDocument all backend integration points and create placeholder