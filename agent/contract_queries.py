"""
Smart Contract Query Utilities
Query the CopyTradingRegistry to get follower relationships
"""

import requests
from typing import Dict, List, Optional
import os

class ContractQuerier:
    def __init__(self, rpc_url: str, registry_id: str, package_id: str):
        self.rpc_url = rpc_url
        self.registry_id = registry_id
        self.package_id = package_id
    
    def query_object(self, object_id: str) -> Optional[Dict]:
        """Query a Sui object by ID"""
        try:
            payload = {
                "jsonrpc": "2.0",
                "id": 1,
                "method": "sui_getObject",
                "params": [
                    object_id,
                    {
                        "showContent": True,
                        "showType": True,
                        "showOwner": True
                    }
                ]
            }
            
            response = requests.post(self.rpc_url, json=payload, timeout=10)
            result = response.json()
            
            if "result" in result and "data" in result["result"]:
                return result["result"]["data"]
            
            return None
        except Exception as e:
            print(f"❌ Error querying object {object_id}: {e}")
            return None
    
    def get_trader_to_followers_map(self) -> Dict[str, List[str]]:
        """
        Query the CopyTradingRegistry and build a trader -> followers mapping
        Returns: {"0xTrader1": ["0xUserA", "0xUserB"], ...}
        """
        try:
            # Query the registry object
            registry = self.query_object(self.registry_id)
            
            if not registry:
                print("⚠️ Could not fetch registry object")
                return {}
            
            content = registry.get("content", {})
            if content.get("dataType") != "moveObject":
                print("⚠️ Registry is not a Move object")
                return {}
            
            fields = content.get("fields", {})
            
            # The trader_followers field is a Table
            # In Sui, Table is represented as an object with a handle
            trader_followers_table = fields.get("trader_followers", {})
            
            # Tables in Sui are dynamic fields - we need to query them specially
            # For now, we'll use events as a fallback
            print("📊 Querying follower relationships from events...")
            return self.get_followers_from_events()
            
        except Exception as e:
            print(f"❌ Error building trader->followers map: {e}")
            return {}
    
    def get_followers_from_events(self) -> Dict[str, List[str]]:
        """
        Query FollowTraderEvent and UnfollowTraderEvent to build the mapping
        This is more reliable than querying Table dynamic fields
        """
        try:
            trader_to_followers = {}
            
            # Query follow events
            payload = {
                "jsonrpc": "2.0",
                "id": 1,
                "method": "suix_queryEvents",
                "params": [
                    {
                        "MoveEventType": f"{self.package_id}::copy_trading::FollowTraderEvent"
                    },
                    None,  # cursor
                    100,   # limit
                    False  # descending order
                ]
            }
            
            response = requests.post(self.rpc_url, json=payload, timeout=10)
            result = response.json()
            
            if "result" in result and "data" in result["result"]:
                for event in result["result"]["data"]:
                    parsed = event.get("parsedJson", {})
                    trader = parsed.get("trader")
                    follower = parsed.get("follower")
                    
                    if trader and follower:
                        if trader not in trader_to_followers:
                            trader_to_followers[trader] = []
                        if follower not in trader_to_followers[trader]:
                            trader_to_followers[trader].append(follower)
            
            # Query unfollow events to remove relationships
            payload["params"][0]["MoveEventType"] = f"{self.package_id}::copy_trading::UnfollowTraderEvent"
            
            response = requests.post(self.rpc_url, json=payload, timeout=10)
            result = response.json()
            
            if "result" in result and "data" in result["result"]:
                for event in result["result"]["data"]:
                    parsed = event.get("parsedJson", {})
                    trader = parsed.get("trader")
                    follower = parsed.get("follower")
                    
                    if trader and follower and trader in trader_to_followers:
                        if follower in trader_to_followers[trader]:
                            trader_to_followers[trader].remove(follower)
            
            # Clean up empty lists
            trader_to_followers = {
                trader: followers 
                for trader, followers in trader_to_followers.items() 
                if followers
            }
            
            return trader_to_followers
            
        except Exception as e:
            print(f"❌ Error querying events: {e}")
            return {}
    
    def get_follower_settings(self, follower: str, trader: str) -> Optional[Dict]:
        """
        Get copy trading settings for a specific follower->trader relationship
        Returns settings dict or None if not following
        """
        try:
            # Query events to find the most recent settings
            payload = {
                "jsonrpc": "2.0",
                "id": 1,
                "method": "suix_queryEvents",
                "params": [
                    {
                        "MoveEventType": f"{self.package_id}::copy_trading::FollowTraderEvent"
                    },
                    None,
                    100,
                    True  # descending to get most recent first
                ]
            }
            
            response = requests.post(self.rpc_url, json=payload, timeout=10)
            result = response.json()
            
            if "result" in result and "data" in result["result"]:
                for event in result["result"]["data"]:
                    parsed = event.get("parsedJson", {})
                    if parsed.get("trader") == trader and parsed.get("follower") == follower:
                        return {
                            "copy_percentage": parsed.get("copy_percentage", 10),
                            "max_trade_size": 100000000,  # Default 0.1 SUI
                            "auto_copy_enabled": True
                        }
            
            # Check for settings update events
            payload["params"][0]["MoveEventType"] = f"{self.package_id}::copy_trading::SettingsUpdatedEvent"
            
            response = requests.post(self.rpc_url, json=payload, timeout=10)
            result = response.json()
            
            if "result" in result and "data" in result["result"]:
                for event in result["result"]["data"]:
                    parsed = event.get("parsedJson", {})
                    if parsed.get("trader") == trader and parsed.get("follower") == follower:
                        return {
                            "copy_percentage": parsed.get("copy_percentage", 10),
                            "max_trade_size": 100000000,
                            "auto_copy_enabled": parsed.get("auto_copy_enabled", True)
                        }
            
            return None
            
        except Exception as e:
            print(f"❌ Error querying settings: {e}")
            return None


# Test the querier
if __name__ == "__main__":
    import os
    from dotenv import load_dotenv
    
    load_dotenv()
    
    querier = ContractQuerier(
        rpc_url=os.getenv("SUI_RPC_URL", "https://rpc-testnet.suiscan.xyz:443"),
        registry_id=os.getenv("COPY_TRADING_REGISTRY_ID", ""),
        package_id=os.getenv("COPY_TRADING_PACKAGE_ID", "")
    )
    
    print("\n🔍 Querying follower relationships from smart contract...")
    trader_map = querier.get_trader_to_followers_map()
    
    print(f"\n📊 Found {len(trader_map)} traders with followers:\n")
    for trader, followers in trader_map.items():
        print(f"Trader: {trader[:16]}...")
        for follower in followers:
            print(f"  └─ Follower: {follower[:16]}...")

