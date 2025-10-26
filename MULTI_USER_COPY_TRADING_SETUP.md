# Multi-User Copy Trading Setup Guide

## ✨ What Changed

The copy trading system now uses the **smart contract as the source of truth** for who follows whom. Each user's follows are stored on-chain based on their wallet address.

### Before (Single User ❌)
- One JSON file for all follows
- Everyone sees the same traders
- No per-user customization

### After (Multi-User ✅)
- Smart contract stores follower relationships
- Each wallet has its own follows
- Agent queries contract for trader→followers mapping
- True decentralization!

---

## 🏗️ Architecture

```
User A's Wallet → Follow Trader1 → Smart Contract
User B's Wallet → Follow Trader2 → Smart Contract
                                         ↓
                               Agent queries contract
                                         ↓
                              Trader1 → [User A]
                              Trader2 → [User B]
                                         ↓
                          Agent monitors both traders
                          Copies only for correct users!
```

---

## 📋 Setup Instructions

### 1. Configure the Agent

Edit `agent/.env` (or create from `.env.example`):

```bash
# Sui Configuration
SUI_RPC_URL=https://rpc-testnet.suiscan.xyz:443
POLLING_INTERVAL=10

# Copy Trading Smart Contract (already deployed)
COPY_TRADING_PACKAGE_ID=0x899c3fa6d4d44bd618e47707cac5030a10535da0483c2256660fef6bdf4cb657
COPY_TRADING_REGISTRY_ID=0x5a5e8d1f938aad93948cceb59dc8cf440294da805f37d754a07d2e9ac8b765f0

# Agent Wallet (for executing trades)
AGENT_PRIVATE_KEY=  # Add your agent's private key
AGENT_ADDRESS=      # Add your agent's address
```

### 2. Start the Agent

```bash
cd agent
source venv/bin/activate
python copy-trading-agent.py
```

**Expected Output:**
```
🤖 FETCH.AI AUTONOMOUS COPY TRADING AGENT
====================================
🚀 Copy Trading Agent starting up...
   📜 Contract Registry: 0x5a5e8d1f938a...
   📊 Loaded 2 traders from smart contract
   📊 Monitoring trader: 0xe39edd65db98... (1 follower(s))
   📊 Monitoring trader: 0x5fd6818ea960... (1 follower(s))
👁️  Scanning for new trades from 2 trader(s)...
```

### 3. Start the Web App

```bash
cd otter-webapp
npm run dev
```

Open: http://localhost:3001

---

## 🎯 How to Use

### For Users

1. **Connect Wallet**
   - Click "Connect Wallet" button
   - Select your Sui wallet

2. **Follow a Trader**
   - Go to "Copy Trading" page
   - Search for or add a trader address
   - Click "Follow"
   - **Approve the transaction** in your wallet
   - Transaction is recorded on-chain!

3. **Check Following**
   - Go to "Following" tab
   - See traders you're following (loaded from smart contract)
   - Each user sees their own follows based on their wallet

4. **Agent Auto-Monitors**
   - Agent queries contract every 10 seconds
   - Detects new follows automatically
   - Copies trades only for the correct users

### Key Features

✅ **Per-Wallet Follows**: Each user has their own follow list  
✅ **On-Chain Storage**: All relationships stored on Sui blockchain  
✅ **Automatic Sync**: Agent automatically detects changes  
✅ **No Manual Sync**: No need to export/import JSON files  
✅ **Decentralized**: No central database required  

---

## 🔧 Testing Multi-User Scenario

### Test with 2 Wallets

**Wallet A (Alice):**
```bash
# Connect Wallet A in browser
# Follow trader: 0xe39edd65db983010aabd984c00d3912fa53f4aaa200c464d2649ced240df841d
```

**Wallet B (Bob):**
```bash
# Connect Wallet B in different browser/incognito
# Follow trader: 0x5fd6818ea960ecf361a15ecb3134bda2600e4138f4a82b1939fdde41530e8a6d
```

**Agent Output:**
```
👁️  Scanning for new trades from 2 trader(s)...
📊 Trader 0xe39edd... has 1 follower(s): 
   - 0xAlice...
📊 Trader 0x5fd681... has 1 follower(s):
   - 0xBob...
```

When Trader1 makes a trade → Only Alice gets the copy  
When Trader2 makes a trade → Only Bob gets the copy  

✅ **Problem solved!**

---

## 📊 Data Flow

### 1. User Follows Trader
```
User clicks "Follow"
  ↓
Web app calls smart contract
  ↓
Transaction: follow_trader(registry, trader, 10%, max_size)
  ↓
FollowTraderEvent emitted
  ↓
Relationship stored on-chain
```

### 2. Agent Detects New Follower
```
Agent polls every 10s
  ↓
Query FollowTraderEvent from contract
  ↓
Build trader→followers map
  ↓
Update monitored_traders dict
  ↓
Start monitoring new trader
```

### 3. Trade Detected & Copied
```
Agent detects trader transaction
  ↓
Query contract for followers of this trader
  ↓
For each follower:
  - Query their copy settings
  - Calculate copy amount
  - Execute trade
  ↓
Only correct users get the copy!
```

---

## 🐛 Troubleshooting

### Agent shows "No traders being followed"

**Problem**: Contract query failing or no events found

**Solutions**:
```bash
# 1. Check contract IDs are correct
echo $COPY_TRADING_PACKAGE_ID
echo $COPY_TRADING_REGISTRY_ID

# 2. Test contract query manually
cd agent
python contract_queries.py

# 3. Check RPC is accessible
curl -X POST https://rpc-testnet.suiscan.xyz:443 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"sui_getChainIdentifier"}'
```

### Wallet connection fails in UI

**Problem**: Wallet not installed or configured

**Solutions**:
1. Install Sui Wallet extension
2. Switch to testnet in wallet settings
3. Refresh page and try again

### Follow transaction fails

**Problem**: Insufficient gas or invalid address

**Solutions**:
```bash
# Get testnet SUI
# Discord: https://discord.gg/sui
# Channel: #testnet-faucet
!faucet YOUR_ADDRESS

# Verify address format
# Should be 0x... and 66 characters
```

### Agent not detecting follows

**Problem**: Events not indexed yet or query limit too low

**Solutions**:
- Wait 30-60 seconds for events to be indexed
- Increase event query limit in contract_queries.py
- Check agent logs for errors

---

## 🚀 Production Deployment

### Security Checklist

- [ ] Use environment variables for all secrets
- [ ] Never commit `.env` to git
- [ ] Use separate wallets for agent (hot) and treasury (cold)
- [ ] Add rate limiting to API endpoints
- [ ] Implement proper error handling
- [ ] Add monitoring and alerts
- [ ] Test with small amounts first

### Scalability

- **100 users**: Current architecture works fine
- **1000+ users**: Consider:
  - Caching contract queries
  - Using Sui indexer API
  - Running multiple agent instances
  - Database for historical data

---

## 📝 API Reference

### Smart Contract Functions

#### `follow_trader`
```move
public entry fun follow_trader(
    registry: &mut CopyTradingRegistry,
    trader: address,
    copy_percentage: u64,      // 0-100
    max_trade_size: u64,       // in MIST
    ctx: &mut TxContext
)
```

#### `unfollow_trader`
```move
public entry fun unfollow_trader(
    registry: &mut CopyTradingRegistry,
    trader: address,
    ctx: &mut TxContext
)
```

### Events

- `FollowTraderEvent`: Emitted when user follows
- `UnfollowTraderEvent`: Emitted when user unfollows
- `TradeCopiedEvent`: Emitted when trade is copied
- `SettingsUpdatedEvent`: Emitted when settings change

---

## ✨ Summary

**What we built:**
- ✅ Multi-user support via smart contract
- ✅ Per-wallet follow lists
- ✅ Automatic agent synchronization
- ✅ On-chain relationship storage
- ✅ Event-based detection
- ✅ No manual sync required

**Key files:**
- `agent/contract_queries.py` - Queries contract for relationships
- `agent/copy-trading-agent.py` - Updated to use contract
- `otter-webapp/src/lib/copy-trading-contract.ts` - Contract integration
- `otter-webapp/src/pages/CopyTradingPage.tsx` - UI with wallet connection

**How it works:**
1. User connects wallet → sees their follows from contract
2. User follows trader → transaction to smart contract
3. Agent queries contract → builds trader→followers map
4. Agent detects trade → copies for correct users only

**Perfect for hackathon!** 🏆

