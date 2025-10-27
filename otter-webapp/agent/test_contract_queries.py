#!/usr/bin/env python3
"""
Test script to verify smart contract query functionality
Run this to test that the agent can properly query follower relationships
"""

import os
import sys
from dotenv import load_dotenv
from contract_queries import ContractQuerier

# Load environment variables
load_dotenv()

def main():
    print("\n" + "="*60)
    print("🧪 TESTING CONTRACT QUERIES")
    print("="*60 + "\n")
    
    # Get configuration
    rpc_url = os.getenv("SUI_RPC_URL", "https://rpc-testnet.suiscan.xyz:443")
    registry_id = os.getenv("COPY_TRADING_REGISTRY_ID", "")
    package_id = os.getenv("COPY_TRADING_PACKAGE_ID", "")
    
    print(f"📡 RPC URL: {rpc_url}")
    print(f"📦 Package ID: {package_id[:16]}...")
    print(f"📋 Registry ID: {registry_id[:16]}...\n")
    
    if not registry_id or not package_id:
        print("❌ ERROR: Missing COPY_TRADING_PACKAGE_ID or COPY_TRADING_REGISTRY_ID")
        print("   Please set these in your .env file")
        sys.exit(1)
    
    # Initialize querier
    querier = ContractQuerier(
        rpc_url=rpc_url,
        registry_id=registry_id,
        package_id=package_id
    )
    
    # Test 1: Query trader->followers mapping
    print("Test 1: Querying trader→followers mapping from contract...")
    print("-" * 60)
    
    trader_map = querier.get_trader_to_followers_map()
    
    if not trader_map:
        print("⚠️  No follower relationships found")
        print("   This is normal if no one has followed any traders yet")
        print("\nℹ️  To test:")
        print("   1. Open the web app (http://localhost:3001)")
        print("   2. Connect a wallet")
        print("   3. Follow a trader")
        print("   4. Run this test again\n")
    else:
        print(f"✅ Found {len(trader_map)} trader(s) with followers:\n")
        for trader, followers in trader_map.items():
            print(f"📊 Trader: {trader}")
            print(f"   Followers ({len(followers)}):")
            for follower in followers:
                print(f"     └─ {follower}")
            print()
    
    # Test 2: Query specific follower settings
    print("\nTest 2: Querying follower settings...")
    print("-" * 60)
    
    if trader_map:
        # Get first trader and follower for testing
        trader = list(trader_map.keys())[0]
        follower = trader_map[trader][0]
        
        print(f"Testing settings for:")
        print(f"  Trader:   {trader}")
        print(f"  Follower: {follower}\n")
        
        settings = querier.get_follower_settings(follower, trader)
        
        if settings:
            print("✅ Settings found:")
            print(f"   Copy Percentage: {settings['copy_percentage']}%")
            print(f"   Max Trade Size:  {settings['max_trade_size']} MIST ({settings['max_trade_size']/1_000_000_000:.2f} SUI)")
            print(f"   Auto-Copy:       {settings['auto_copy_enabled']}")
        else:
            print("⚠️  No settings found for this relationship")
    else:
        print("⏭️  Skipped (no relationships to test)")
    
    # Summary
    print("\n" + "="*60)
    print("📋 SUMMARY")
    print("="*60)
    print(f"Total traders monitored: {len(trader_map)}")
    total_followers = sum(len(followers) for followers in trader_map.values())
    print(f"Total follower relationships: {total_followers}")
    
    if trader_map:
        print("\n✅ Contract queries working correctly!")
        print("   The agent will use these relationships to copy trades.")
    else:
        print("\n⚠️  No relationships found yet")
        print("   Follow some traders in the web app to test the full flow")
    
    print("\n" + "="*60 + "\n")

if __name__ == "__main__":
    main()

