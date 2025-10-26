"""
Sui Transaction Executor
Executes actual blockchain transactions for copy trading
"""

import os
import json
import requests
from typing import Optional, Dict, List
from dotenv import load_dotenv

load_dotenv()

class SuiTransactionExecutor:
    def __init__(self, rpc_url: str):
        self.rpc_url = rpc_url
        self.agent_address = os.getenv("AGENT_ADDRESS", "")
        
        # For testnet demo, we'll use a simpler approach without private keys
        # In production, you'd use the Sui SDK with proper key management
        
    def get_gas_coins(self, address: str, amount: int = 100000000) -> List[Dict]:
        """Get available gas coins for an address"""
        try:
            payload = {
                "jsonrpc": "2.0",
                "id": 1,
                "method": "suix_getCoins",
                "params": [
                    address,
                    "0x2::sui::SUI",
                    None,  # cursor
                    50      # limit
                ]
            }
            
            response = requests.post(self.rpc_url, json=payload, timeout=10)
            result = response.json()
            
            if "result" in result and "data" in result["result"]:
                return result["result"]["data"]
            return []
        except Exception as e:
            print(f"❌ Error getting gas coins: {e}")
            return []
    
    def get_balance(self, address: str) -> int:
        """Get SUI balance for an address in MIST"""
        try:
            payload = {
                "jsonrpc": "2.0",
                "id": 1,
                "method": "suix_getBalance",
                "params": [address, "0x2::sui::SUI"]
            }
            
            response = requests.post(self.rpc_url, json=payload, timeout=10)
            result = response.json()
            
            if "result" in result:
                return int(result["result"]["totalBalance"])
            return 0
        except Exception as e:
            print(f"❌ Error getting balance: {e}")
            return 0
    
    def execute_sui_transfer(
        self,
        from_address: str,
        to_address: str,
        amount: int,
        gas_budget: int = 10000000
    ) -> Optional[str]:
        """
        Execute a SUI transfer on testnet
        
        NOTE: This requires the CLI to be set up with the from_address
        For demo purposes, we'll show the command that would be executed
        """
        try:
            # Check if sender has enough balance
            balance = self.get_balance(from_address)
            total_needed = amount + gas_budget
            
            if balance < total_needed:
                print(f"❌ Insufficient balance: {balance} MIST, need {total_needed} MIST")
                return None
            
            # For testnet demo, we'll construct the transaction but not execute it
            # In production with proper wallet setup, this would use pysui to execute
            
            print(f"💰 Would execute transfer:")
            print(f"   From: {from_address[:16]}...")
            print(f"   To: {to_address[:16]}...")
            print(f"   Amount: {amount} MIST ({amount/1_000_000_000:.6f} SUI)")
            print(f"   Gas: {gas_budget} MIST")
            
            # Get a coin to use
            coins = self.get_gas_coins(from_address, amount + gas_budget)
            if not coins:
                print(f"   ❌ No suitable coins found")
                return None
            
            coin_id = coins[0]["coinObjectId"]
            
            # Generate command for manual execution
            cmd = f"""sui client transfer-sui \\
  --to {to_address} \\
  --sui-coin-object-id {coin_id} \\
  --amount {amount} \\
  --gas-budget {gas_budget}"""
            
            print(f"   Coin Object: {coin_id}")
            print(f"   Command: {cmd}")
            
            # Return a mock digest for demo
            # In production, this would be the real transaction digest
            return f"0xMOCK_DIGEST_FOR_DEMO_{amount}"
            
        except Exception as e:
            print(f"❌ Error executing transfer: {e}")
            return None
    
    def copy_transfer_transaction(
        self,
        original_tx: Dict,
        follower_address: str,
        copy_percentage: int = 10,
        max_trade_size: int = 100000000
    ) -> Optional[str]:
        """
        Copy a transfer transaction for a follower
        """
        try:
            # Extract transaction details
            balance_changes = original_tx.get("balanceChanges", [])
            
            # Find the transfer amount (negative balance change for sender)
            original_amount = 0
            recipient = None
            
            for change in balance_changes:
                amount = int(change.get("amount", 0))
                if amount < 0:
                    original_amount = abs(amount)
                elif amount > 0 and not recipient:
                    recipient = change.get("owner", {}).get("AddressOwner", "")
            
            if original_amount == 0 or not recipient:
                print("⚠️ Could not extract transfer details")
                return None
            
            # Calculate copy amount
            copy_amount = (original_amount * copy_percentage) // 100
            copy_amount = min(copy_amount, max_trade_size)
            
            # Ensure minimum amount (avoid dust)
            if copy_amount < 1000000:  # Less than 0.001 SUI
                print(f"⚠️ Copy amount too small: {copy_amount} MIST, skipping")
                return None
            
            print(f"\n📋 Copying transfer:")
            print(f"   Original amount: {original_amount/1_000_000_000:.6f} SUI")
            print(f"   Copy amount: {copy_amount/1_000_000_000:.6f} SUI ({copy_percentage}%)")
            print(f"   Follower: {follower_address[:16]}...")
            print(f"   Recipient: {recipient[:16]}...")
            
            # Execute the copy
            digest = self.execute_sui_transfer(
                from_address=follower_address,
                to_address=recipient,
                amount=copy_amount
            )
            
            return digest
            
        except Exception as e:
            print(f"❌ Error copying transfer: {e}")
            return None


# Test the executor
if __name__ == "__main__":
    print("\n🧪 Testing Sui Transaction Executor\n")
    
    rpc_url = os.getenv("SUI_RPC_URL", "https://fullnode.testnet.sui.io:443")
    executor = SuiTransactionExecutor(rpc_url)
    
    # Test address (your wallet)
    test_address = "0xe39edd65db983010aabd984c00d3912fa53f4aaa200c464d2649ced240df841d"
    
    print(f"Testing with address: {test_address[:16]}...")
    
    # Get balance
    balance = executor.get_balance(test_address)
    print(f"Balance: {balance} MIST ({balance/1_000_000_000:.6f} SUI)")
    
    # Get gas coins
    coins = executor.get_gas_coins(test_address)
    print(f"Gas coins available: {len(coins)}")
    
    print("\n✅ Executor initialized successfully")
    print("\nNote: Actual execution requires wallet setup with private keys")
    print("For demo, use the Sui CLI to execute the generated commands")

