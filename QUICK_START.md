# 🚀 Quick Start - Multi-User Copy Trading

## What Changed?

Your copy trading system now supports **multiple users**! Each wallet has its own follow list stored on the blockchain.

---

## ⚡ Quick Setup (5 Minutes)

### 1. Configure Agent

```bash
cd agent
nano .env
```

Add these lines (contract already deployed):
```bash
COPY_TRADING_PACKAGE_ID=0x899c3fa6d4d44bd618e47707cac5030a10535da0483c2256660fef6bdf4cb657
COPY_TRADING_REGISTRY_ID=0x5a5e8d1f938aad93948cceb59dc8cf440294da805f37d754a07d2e9ac8b765f0
SUI_RPC_URL=https://rpc-testnet.suiscan.xyz:443
POLLING_INTERVAL=10
```

### 2. Test Contract Queries

```bash
cd agent
source venv/bin/activate
python test_contract_queries.py
```

Should show: "No relationships found yet" (this is normal!)

### 3. Start Agent

```bash
python copy-trading-agent.py
```

Should show: "⏸️ No traders being followed. Waiting..."

### 4. Start Web App

```bash
cd otter-webapp
npm run dev
```

Open: http://localhost:3001

### 5. Test It!

1. **Connect Wallet** → Click "Connect Wallet"
2. **Go to Copy Trading** → Navigate to page
3. **Add Trader** → Paste: `0xe39edd65db983010aabd984c00d3912fa53f4aaa200c464d2649ced240df841d`
4. **Click Follow** → Approve transaction in wallet
5. **Check Agent** → Should show: "📊 Monitoring trader: 0xe39edd..."

✅ **It works!**

---

## 🎯 Key Differences

### Old Way (JSON File)
```json
{
  "followedTraders": ["0xTrader1", "0xTrader2"]
}
```
→ Everyone shares this list

### New Way (Smart Contract)
```
Wallet A → Follows: [Trader1]
Wallet B → Follows: [Trader2]
```
→ Each wallet has its own list!

---

## 📊 How It Works

```
User connects wallet
  ↓
Clicks "Follow" on trader
  ↓
Transaction sent to smart contract
  ↓
FollowTraderEvent emitted
  ↓
Agent detects event (within 10s)
  ↓
Agent monitors this trader for this user
  ↓
When trader makes a transaction
  ↓
Agent copies ONLY for this user!
```

---

## 🧪 Test Multi-User

**Browser 1 (Wallet A):**
- Follow `0xe39edd...`

**Browser 2 (Wallet B):**
- Follow `0x5fd681...`

**Agent shows:**
```
📊 Monitoring 2 traders
   Trader 0xe39edd... → 1 follower (Wallet A)
   Trader 0x5fd681... → 1 follower (Wallet B)
```

✅ **Separate follows for each user!**

---

## 💡 Demo Tips

### For Judges

1. **Show the problem**: "One JSON file = everyone follows the same traders"
2. **Show the solution**: "Smart contract = per-wallet follows"
3. **Live demo**: Connect two wallets, follow different traders
4. **Show agent**: Real-time detection from blockchain events
5. **Emphasize**: "Everything is on-chain, fully decentralized"

### Key Points

- ✅ Sui Move smart contracts
- ✅ Fetch.ai autonomous agents
- ✅ Wallet-based auth
- ✅ On-chain storage
- ✅ Event-driven sync
- ✅ Multi-user support

---

## 🐛 Troubleshooting

**"No wallet connected"**
```bash
# Install Sui Wallet extension
# Switch to testnet
# Refresh page
```

**"Transaction failed"**
```bash
# Get testnet SUI from faucet
# Discord: https://discord.gg/sui
# Channel: #testnet-faucet
!faucet YOUR_ADDRESS
```

**"Agent not detecting follows"**
```bash
# Wait 30 seconds (events need indexing)
# Check agent logs for errors
# Verify contract IDs in .env
```

---

## 📚 More Info

- **Full Setup**: Read `MULTI_USER_COPY_TRADING_SETUP.md`
- **Implementation Details**: Read `IMPLEMENTATION_SUMMARY.md`
- **Original Features**: Read `COPY_TRADING_FEATURES.md`

---

## ✨ What You Built

A **fully decentralized copy trading platform** where:
- Each user has their own follow list
- All relationships stored on Sui blockchain
- Autonomous agent monitors 24/7
- Real smart contracts, no mocks
- Production-ready architecture

**Perfect for your hackathon demo!** 🏆

---

## 🎬 One-Liner Pitch

> "We built copy trading on Sui blockchain where every follow is an on-chain transaction, monitored by autonomous Fetch.ai agents that automatically copy trades for the right users—fully decentralized, zero manual sync."

Good luck! 🚀

