"""
Fetch.ai Autonomous Copy Trading Agent
Monitors trader addresses and automatically copies their trades
"""

import asyncio
import json
import os
from datetime import datetime
from typing import Dict, List, Optional
from dotenv import load_dotenv

# Fetch.ai imports
from uagents import Agent, Context, Model
from uagents.setup import fund_agent_if_low

# Sui imports
import requests

# Load environment variables
load_dotenv()

# Configuration
FETCHAI_API_KEY = os.getenv("FETCHAI_API_KEY", "sk_1ca6bd86b301469c87e42c79875dc6ecfa7684f8aaf54dd093bab30c619051a7")
SUI_RPC_URL = os.getenv("SUI_RPC_URL", "https://rpc-testnet.suiscan.xyz:443")
COPY_TRADING_PACKAGE_ID = os.getenv("COPY_TRADING_PACKAGE_ID", "")
COPY_TRADING_REGISTRY_ID = os.getenv("COPY_TRADING_REGISTRY_ID", "")
POLLING_INTERVAL = int(os.getenv("POLLING_INTERVAL", "10"))  # seconds

# Agent setup
agent = Agent(
    name="copy_trading_agent",
    seed="copy_trading_secret_seed_12345",
    port=8000,
    endpoint=["http://127.0.0.1:8000/submit"],
)

# Fund agent with test tokens (for testnet)
fund_agent_if_low(agent.wallet.address())

print(f"🤖 Copy Trading Agent Address: {agent.address}")
print(f"💼 Agent Wallet: {agent.wallet.address()}")


# Data Models
class TradeDetected(Model):
    """Message model for detected trades"""
    trader: str
    asset: str
    action: str  # "buy", "sell", "swap"
    amount: str
    price: str
    timestamp: int
    tx_digest: str


class TradeCopied(Model):
    """Message model for copied trades"""
    follower: str
    trader: str
    amount: str
    success: bool
    tx_digest: Optional[str] = None
    error: Optional[str] = None


# In-memory storage
class AgentState:
    def __init__(self):
        self.monitored_traders: Dict[str, List[str]] = {}  # trader -> [followers]
        self.last_processed_tx: Dict[str, str] = {}  # trader -> last_tx_digest
        self.trade_history: List[Dict] = []
        
    def add_follower(self, trader: str, follower: str):
        if trader not in self.monitored_traders:
            self.monitored_traders[trader] = []
        if follower not in self.monitored_traders[trader]:
            self.monitored_traders[trader].append(follower)
    
    def get_followers(self, trader: str) -> List[str]:
        return self.monitored_traders.get(trader, [])


state = AgentState()


# Sui Blockchain Functions
async def query_sui_transactions(address: str, limit: int = 10) -> List[Dict]:
    """Query transactions for a specific address using Sui RPC"""
    try:
        payload = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "suix_queryTransactionBlocks",
            "params": [
                {
                    "filter": {"FromAddress": address},
                    "options": {
                        "showInput": True,
                        "showEffects": True,
                        "showEvents": True,
                        "showBalanceChanges": True,
                    }
                },
                None,  # cursor
                limit,
                True  # descending order
            ]
        }
        
        response = requests.post(SUI_RPC_URL, json=payload, timeout=10)
        result = response.json()
        
        if "result" in result and "data" in result["result"]:
            return result["result"]["data"]
        return []
    except Exception as e:
        print(f"❌ Error querying Sui: {e}")
        return []


async def analyze_trade(tx: Dict) -> Optional[TradeDetected]:
    """Analyze a transaction and extract trade information"""
    try:
        # Extract basic info
        digest = tx.get("digest", "")
        timestamp = tx.get("timestampMs", 0)
        sender = tx.get("transaction", {}).get("data", {}).get("sender", "")
        
        # Analyze balance changes to determine trade type
        balance_changes = tx.get("balanceChanges", [])
        
        if not balance_changes:
            return None
        
        # Simple heuristic: If there are 2+ balance changes, it's likely a swap
        if len(balance_changes) >= 2:
            # Find the outgoing (negative) and incoming (positive) amounts
            outgoing = None
            incoming = None
            
            for change in balance_changes:
                amount = int(change.get("amount", 0))
                coin_type = change.get("coinType", "").split("::")[-1]
                
                if amount < 0 and not outgoing:
                    outgoing = {"coin": coin_type, "amount": abs(amount)}
                elif amount > 0 and not incoming:
                    incoming = {"coin": coin_type, "amount": amount}
            
            if outgoing and incoming:
                return TradeDetected(
                    trader=sender,
                    asset=f"{outgoing['coin']}/{incoming['coin']}",
                    action="swap",
                    amount=str(outgoing['amount']),
                    price=str(incoming['amount'] / outgoing['amount']) if outgoing['amount'] > 0 else "0",
                    timestamp=int(timestamp),
                    tx_digest=digest
                )
        
        # Single balance change = transfer
        elif len(balance_changes) == 1:
            change = balance_changes[0]
            amount = abs(int(change.get("amount", 0)))
            coin_type = change.get("coinType", "").split("::")[-1]
            
            return TradeDetected(
                trader=sender,
                asset=coin_type,
                action="transfer",
                amount=str(amount),
                price="0",
                timestamp=int(timestamp),
                tx_digest=digest
            )
        
        return None
    except Exception as e:
        print(f"⚠️ Error analyzing trade: {e}")
        return None


async def execute_copy_trade(follower: str, trade: TradeDetected) -> TradeCopied:
    """Execute a copy trade for a follower"""
    try:
        # In a real implementation, this would:
        # 1. Query the follower's copy settings from the smart contract
        # 2. Calculate the appropriate copy amount based on settings
        # 3. Execute the trade on the DEX
        # 4. Call the smart contract's execute_copy_trade function
        
        # For now, we'll simulate the copy trade
        print(f"📋 Copying trade for {follower[:8]}...")
        print(f"   Trader: {trade.trader[:8]}...")
        print(f"   Action: {trade.action}")
        print(f"   Asset: {trade.asset}")
        print(f"   Amount: {trade.amount}")
        
        # Simulate success
        await asyncio.sleep(0.5)  # Simulate blockchain transaction
        
        return TradeCopied(
            follower=follower,
            trader=trade.trader,
            amount=trade.amount,
            success=True,
            tx_digest=f"0x{'0'*60}{follower[-4:]}"  # Mock tx digest
        )
    except Exception as e:
        return TradeCopied(
            follower=follower,
            trader=trade.trader,
            amount=trade.amount,
            success=False,
            error=str(e)
        )


# Load followed traders from file
def load_followed_traders():
    """Load followed traders from JSON file"""
    try:
        import os
        file_path = os.path.join(os.path.dirname(__file__), 'followed_traders.json')
        
        if os.path.exists(file_path):
            with open(file_path, 'r') as f:
                data = json.load(f)
                return data.get('followedTraders', [])
    except Exception as e:
        print(f"⚠️ Could not load followed traders: {e}")
    
    # No fallback - only monitor traders explicitly added by user
    return []


# Save trade history to file for UI to read
def save_trade_history(history):
    """Save trade history to JSON file"""
    try:
        import os
        file_path = os.path.join(os.path.dirname(__file__), 'trade_history.json')
        
        # Keep only last 100 trades
        recent_history = history[-100:] if len(history) > 100 else history
        
        data = {
            "trades": recent_history,
            "lastUpdated": datetime.now().isoformat(),
            "totalTrades": len(history)
        }
        
        with open(file_path, 'w') as f:
            json.dump(data, f, indent=2)
    except Exception as e:
        print(f"⚠️ Could not save trade history: {e}")


# Agent Event Handlers
@agent.on_event("startup")
async def startup(ctx: Context):
    """Agent startup - initialize monitoring"""
    ctx.logger.info("🚀 Copy Trading Agent starting up...")
    ctx.logger.info(f"   Agent Address: {agent.address}")
    ctx.logger.info(f"   Polling Interval: {POLLING_INTERVAL}s")
    ctx.logger.info(f"   SUI RPC: {SUI_RPC_URL}")
    
    # Load traders from file (updated by webapp)
    followed_traders = load_followed_traders()
    
    ctx.logger.info(f"   📂 Loaded {len(followed_traders)} traders from file")
    
    for trader in followed_traders:
        state.add_follower(trader, "0xuser_follower")
        ctx.logger.info(f"   📊 Monitoring trader: {trader[:16]}...")
    
    ctx.storage.set("initialized", True)


@agent.on_interval(period=POLLING_INTERVAL)
async def monitor_trades(ctx: Context):
    """Periodic task to monitor traders and detect new trades"""
    if not ctx.storage.get("initialized"):
        return
    
    # Periodically reload followed traders from file (every scan)
    followed_traders = load_followed_traders()
    
    # Update monitored traders if file changed
    for trader_addr in followed_traders:
        if trader_addr not in state.monitored_traders:
            state.add_follower(trader_addr, "0xuser_follower")
            ctx.logger.info(f"   ➕ Now monitoring new trader: {trader_addr[:16]}...")
    
    # Remove traders no longer in file
    for trader_addr in list(state.monitored_traders.keys()):
        if trader_addr not in followed_traders:
            del state.monitored_traders[trader_addr]
            ctx.logger.info(f"   ➖ Stopped monitoring trader: {trader_addr[:16]}...")
    
    ctx.logger.info("👁️  Scanning for new trades...")
    
    for trader, followers in state.monitored_traders.items():
        if not followers:
            continue
        
        # Query recent transactions (in descending order - newest first)
        transactions = await query_sui_transactions(trader, limit=5)
        
        if not transactions:
            continue
        
        # Check if this is the first scan for this trader
        if trader not in state.last_processed_tx:
            # On first scan, just record the most recent tx and don't process old ones
            state.last_processed_tx[trader] = transactions[0].get("digest", "")
            ctx.logger.info(f"   📌 Initialized tracking for {trader[:16]}... (skipping {len(transactions)} old transactions)")
            continue
        
        # Get the last processed transaction digest
        last_digest = state.last_processed_tx.get(trader, "")
        
        # Find new transactions (stop when we hit the last processed one)
        new_transactions = []
        for tx in transactions:
            tx_digest = tx.get("digest", "")
            if tx_digest == last_digest:
                # We've reached the last transaction we processed, stop here
                break
            new_transactions.append(tx)
        
        # If no new transactions, continue
        if not new_transactions:
            continue
        
        # Process new transactions in reverse order (oldest new transaction first)
        for tx in reversed(new_transactions):
            tx_digest = tx.get("digest", "")
            
            # Analyze the transaction
            trade = await analyze_trade(tx)
            
            if trade:
                ctx.logger.info(f"🎯 New trade detected!")
                ctx.logger.info(f"   Trader: {trade.trader[:16]}...")
                ctx.logger.info(f"   Action: {trade.action}")
                ctx.logger.info(f"   Asset: {trade.asset}")
                ctx.logger.info(f"   Amount: {trade.amount}")
                ctx.logger.info(f"   TX: {tx_digest[:16]}...")
                
                # Copy trade for all followers
                for follower in followers:
                    result = await execute_copy_trade(follower, trade)
                    
                    if result.success:
                        ctx.logger.info(f"   ✅ Copied for {follower[:16]}... TX: {result.tx_digest[:16]}...")
                        
                        # Store in history
                        trade_record = {
                            "timestamp": datetime.now().isoformat(),
                            "trader": trade.trader,
                            "follower": follower,
                            "action": trade.action,
                            "asset": trade.asset,
                            "amount": trade.amount,
                            "success": True,
                            "txDigest": trade.tx_digest
                        }
                        state.trade_history.append(trade_record)
                        
                        # Save to file for UI to read
                        save_trade_history(state.trade_history)
                    else:
                        ctx.logger.error(f"   ❌ Copy failed for {follower[:16]}...: {result.error}")
        
        # Update last processed to the most recent transaction
        state.last_processed_tx[trader] = transactions[0].get("digest", "")
        ctx.logger.info(f"   ✅ Processed {len(new_transactions)} new transaction(s) for {trader[:16]}...")


@agent.on_message(model=TradeDetected)
async def handle_trade_detected(ctx: Context, sender: str, msg: TradeDetected):
    """Handle trade detected messages"""
    ctx.logger.info(f"📨 Received trade detection from {sender}")
    # This handler can be used for inter-agent communication


@agent.on_event("shutdown")
async def shutdown(ctx: Context):
    """Agent shutdown"""
    ctx.logger.info("👋 Copy Trading Agent shutting down...")
    ctx.logger.info(f"   Total trades copied: {len(state.trade_history)}")


# Main execution
if __name__ == "__main__":
    print("\n" + "="*60)
    print("🤖 FETCH.AI AUTONOMOUS COPY TRADING AGENT")
    print("="*60)
    print(f"Agent Address: {agent.address}")
    print(f"Monitoring Interval: {POLLING_INTERVAL} seconds")
    print("\nPress Ctrl+C to stop")
    print("="*60 + "\n")
    
    agent.run()

