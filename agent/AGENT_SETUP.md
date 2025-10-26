# Copy Trading Agent Setup

## Prerequisites
- Python 3.10 or higher
- pip package manager
- Active internet connection

## Installation

### 1. Create Virtual Environment
```bash
cd /Users/anson/sui-otter/agent
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 2. Install Dependencies
```bash
pip install -r requirements-copy-trading.txt
```

### 3. Configure Environment
```bash
cp .env.template .env
# Edit .env and add your deployed contract IDs
```

## Running the Agent

### Start the Agent
```bash
cd /Users/anson/sui-otter/agent
source venv/bin/activate
python copy-trading-agent.py
```

### Expected Output
```
🤖 FETCH.AI AUTONOMOUS COPY TRADING AGENT
====================================
Agent Address: agent1...
Monitoring Interval: 10 seconds

Press Ctrl+C to stop
====================================

🚀 Copy Trading Agent starting up...
   Agent Address: agent1...
   📊 Monitoring trader: 0x2c8d603bc51326...
   📊 Monitoring trader: 0x5c560ae72abed2...
👁️  Scanning for new trades...
```

## How It Works

1. **Monitors Traders**: The agent continuously polls the Sui blockchain for transactions from monitored trader addresses

2. **Detects Trades**: When a trader makes a swap, transfer, or other trade, the agent detects it immediately

3. **Analyzes Trade**: The agent analyzes the trade to determine:
   - Asset being traded
   - Trade type (swap, transfer, etc.)
   - Amount and price
   - Timestamp

4. **Copies Trade**: For each follower of that trader:
   - Fetches their copy settings from the smart contract
   - Calculates appropriate copy amount based on their percentage
   - Executes the same trade
   - Records the result

5. **Reports**: The agent logs all activity and maintains a history of copied trades

## Adding Traders to Monitor

The agent automatically monitors traders based on the smart contract's follower relationships. When a user follows a trader via the web UI, the agent will start monitoring that trader's transactions.

For testing, you can manually add traders in the agent code:

```python
# In copy-trading-agent.py, startup function:
state.add_follower("0xTRADER_ADDRESS", "0xFOLLOWER_ADDRESS")
```

## Troubleshooting

### Agent won't start
- Check Python version: `python --version` (should be 3.10+)
- Reinstall dependencies: `pip install -r requirements-copy-trading.txt --upgrade`

### No trades detected
- Verify the trader addresses are active
- Check the RPC URL is accessible
- Increase polling interval in .env

### Copy trades failing
- Ensure contract IDs are correct in .env
- Verify follower has sufficient balance
- Check Sui testnet status

## Advanced Configuration

### Change Polling Interval
Edit `.env`:
```
POLLING_INTERVAL=5  # Check every 5 seconds (faster)
```

### Use Different RPC
Edit `.env`:
```
SUI_RPC_URL=https://fullnode.testnet.sui.io:443
```

### Deploy to Cloud (Agentverse)

To run the agent 24/7 in the cloud:

1. Create account at [agentverse.ai](https://agentverse.ai)
2. Upload `copy-trading-agent.py`
3. Set environment variables
4. Deploy and activate

## Monitoring

### View Agent Logs
The agent prints all activity to console. For production, redirect to a file:
```bash
python copy-trading-agent.py > agent.log 2>&1 &
```

### Check Running Status
```bash
ps aux | grep copy-trading-agent
```

### Stop the Agent
Press `Ctrl+C` or:
```bash
pkill -f copy-trading-agent
```

## Production Checklist

Before running in production:
- [ ] Deploy copy trading contract to mainnet
- [ ] Update contract IDs in .env
- [ ] Use mainnet RPC URL
- [ ] Set up proper logging
- [ ] Configure error alerts
- [ ] Test with small amounts first
- [ ] Monitor gas consumption
- [ ] Set up automatic restart on failure

