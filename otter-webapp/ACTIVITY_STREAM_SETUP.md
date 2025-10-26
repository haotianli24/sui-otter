# Activity Stream Setup

The activity stream is now fully integrated and uses your connected wallet address to display transaction history.

## How to Run

### Option 1: Run both API server and dev server together
```bash
npm run dev:full
```

This will start:
- API server on `http://localhost:3001`
- Vite dev server on `http://localhost:5173`

### Option 2: Run separately (if you prefer)

Terminal 1 - Start the API server:
```bash
npm run api
```

Terminal 2 - Start the Vite dev server:
```bash
npm run dev
```

## What's Included

- **Activity Stream Page**: `/src/pages/StreamPage.tsx` - Shows your wallet's transaction history
- **Activity Components**: 
  - `/src/components/stream/activity-item.tsx` - Individual activity display
  - `/src/components/stream/activity-list.tsx` - List of activities
- **API Server**: `api-server.js` - Handles transaction data fetching and explanations
- **Transaction Polling Hook**: `/src/hooks/use-transaction-polling.ts` - Fetches and polls activities

## Features

- ✅ Real-time activity monitoring (polls every 30 seconds)
- ✅ Connected wallet address auto-detection
- ✅ Transaction details with gas fees, participants, and operations
- ✅ AI-powered transaction explanations
- ✅ Filter by activity type (transfers, swaps, NFTs, smart contracts)
- ✅ Load more pagination
- ✅ Live status indicator

## How It Works

1. When you connect your wallet, the app automatically fetches your transaction history
2. The API server queries the Sui blockchain for your transactions
3. Activities are displayed in real-time with a 30-second polling interval
4. Click "Explain" on any transaction to get an AI-powered summary
5. Use filters to narrow down activity types

## API Endpoints

- `POST /api/address-activity` - Fetch transactions for an address
- `POST /api/transaction-explorer` - Get detailed transaction information
- `POST /api/transaction-explain` - Generate AI explanation for a transaction
