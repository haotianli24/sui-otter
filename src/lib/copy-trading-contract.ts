/**
 * Copy Trading Smart Contract Integration
 * Functions to interact with the on-chain copy trading contract
 */

import { Transaction } from '@mysten/sui/transactions';
import { SuiClient } from '@mysten/sui/client';

// Contract constants (from deployed.json)
export const COPY_TRADING_PACKAGE_ID = "0x899c3fa6d4d44bd618e47707cac5030a10535da0483c2256660fef6bdf4cb657";
export const COPY_TRADING_REGISTRY_ID = "0x5a5e8d1f938aad93948cceb59dc8cf440294da805f37d754a07d2e9ac8b765f0";

/**
 * Build a transaction to follow a trader
 */
export function buildFollowTraderTx(
  traderAddress: string,
  copyPercentage: number = 10,
  maxTradeSize: string = "100000000" // 0.1 SUI in MIST
): Transaction {
  const tx = new Transaction();
  
  tx.moveCall({
    target: `${COPY_TRADING_PACKAGE_ID}::copy_trading::follow_trader`,
    arguments: [
      tx.object(COPY_TRADING_REGISTRY_ID),
      tx.pure.address(traderAddress),
      tx.pure.u64(copyPercentage),
      tx.pure.u64(maxTradeSize),
    ],
  });
  
  return tx;
}

/**
 * Build a transaction to unfollow a trader
 */
export function buildUnfollowTraderTx(traderAddress: string): Transaction {
  const tx = new Transaction();
  
  tx.moveCall({
    target: `${COPY_TRADING_PACKAGE_ID}::copy_trading::unfollow_trader`,
    arguments: [
      tx.object(COPY_TRADING_REGISTRY_ID),
      tx.pure.address(traderAddress),
    ],
  });
  
  return tx;
}

/**
 * Build a transaction to update copy settings
 */
export function buildUpdateSettingsTx(
  traderAddress: string,
  copyPercentage: number,
  maxTradeSize: string,
  autoCopyEnabled: boolean
): Transaction {
  const tx = new Transaction();
  
  tx.moveCall({
    target: `${COPY_TRADING_PACKAGE_ID}::copy_trading::update_settings`,
    arguments: [
      tx.object(COPY_TRADING_REGISTRY_ID),
      tx.pure.address(traderAddress),
      tx.pure.u64(copyPercentage),
      tx.pure.u64(maxTradeSize),
      tx.pure.bool(autoCopyEnabled),
    ],
  });
  
  return tx;
}

/**
 * Query if a user is following a trader
 */
export async function isFollowingTrader(
  client: SuiClient,
  followerAddress: string,
  traderAddress: string
): Promise<boolean> {
  try {
    // Query FollowTraderEvent to see if this relationship exists
    const events = await client.queryEvents({
      query: {
        MoveEventType: `${COPY_TRADING_PACKAGE_ID}::copy_trading::FollowTraderEvent`,
      },
      limit: 100,
      order: 'descending',
    });
    
    // Check if there's a follow event for this pair
    const followEvent = events.data.find((event) => {
      const parsed = event.parsedJson as any;
      return parsed.follower === followerAddress && parsed.trader === traderAddress;
    });
    
    if (!followEvent) return false;
    
    // Check if there's a subsequent unfollow event
    const unfollowEvents = await client.queryEvents({
      query: {
        MoveEventType: `${COPY_TRADING_PACKAGE_ID}::copy_trading::UnfollowTraderEvent`,
      },
      limit: 100,
      order: 'descending',
    });
    
    const unfollowEvent = unfollowEvents.data.find((event) => {
      const parsed = event.parsedJson as any;
      return parsed.follower === followerAddress && parsed.trader === traderAddress;
    });
    
    // If there's an unfollow event that's more recent, they're not following
    if (unfollowEvent && followEvent) {
      const unfollowTimestamp = parseInt(unfollowEvent.timestampMs || '0');
      const followTimestamp = parseInt(followEvent.timestampMs || '0');
      return followTimestamp > unfollowTimestamp;
    }
    
    return true;
  } catch (error) {
    console.error('Error checking if following trader:', error);
    return false;
  }
}

/**
 * Get all traders that a user is following
 */
export async function getFollowedTraders(
  client: SuiClient,
  followerAddress: string
): Promise<string[]> {
  try {
    // Query all FollowTraderEvent for this follower
    const followEvents = await client.queryEvents({
      query: {
        MoveEventType: `${COPY_TRADING_PACKAGE_ID}::copy_trading::FollowTraderEvent`,
      },
      limit: 100,
      order: 'descending',
    });
    
    const unfollowEvents = await client.queryEvents({
      query: {
        MoveEventType: `${COPY_TRADING_PACKAGE_ID}::copy_trading::UnfollowTraderEvent`,
      },
      limit: 100,
      order: 'descending',
    });
    
    // Build a set of followed traders
    const followed = new Set<string>();
    const unfollowed = new Set<string>();
    
    // Process unfollow events first (they're more recent)
    for (const event of unfollowEvents.data) {
      const parsed = event.parsedJson as any;
      if (parsed.follower === followerAddress) {
        unfollowed.add(parsed.trader);
      }
    }
    
    // Process follow events
    for (const event of followEvents.data) {
      const parsed = event.parsedJson as any;
      if (parsed.follower === followerAddress) {
        // Only add if not subsequently unfollowed
        if (!unfollowed.has(parsed.trader)) {
          followed.add(parsed.trader);
        }
      }
    }
    
    return Array.from(followed);
  } catch (error) {
    console.error('Error getting followed traders:', error);
    return [];
  }
}

/**
 * Get copy settings for a follower->trader relationship
 */
export async function getCopySettings(
  client: SuiClient,
  followerAddress: string,
  traderAddress: string
): Promise<{ copyPercentage: number; maxTradeSize: string; autoCopyEnabled: boolean } | null> {
  try {
    // Query the most recent SettingsUpdatedEvent or FollowTraderEvent
    const settingsEvents = await client.queryEvents({
      query: {
        MoveEventType: `${COPY_TRADING_PACKAGE_ID}::copy_trading::SettingsUpdatedEvent`,
      },
      limit: 100,
      order: 'descending',
    });
    
    // Check for settings update
    for (const event of settingsEvents.data) {
      const parsed = event.parsedJson as any;
      if (parsed.follower === followerAddress && parsed.trader === traderAddress) {
        return {
          copyPercentage: parsed.copy_percentage,
          maxTradeSize: '100000000', // Default
          autoCopyEnabled: parsed.auto_copy_enabled,
        };
      }
    }
    
    // Fall back to follow event
    const followEvents = await client.queryEvents({
      query: {
        MoveEventType: `${COPY_TRADING_PACKAGE_ID}::copy_trading::FollowTraderEvent`,
      },
      limit: 100,
      order: 'descending',
    });
    
    for (const event of followEvents.data) {
      const parsed = event.parsedJson as any;
      if (parsed.follower === followerAddress && parsed.trader === traderAddress) {
        return {
          copyPercentage: parsed.copy_percentage || 10,
          maxTradeSize: '100000000',
          autoCopyEnabled: true,
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error getting copy settings:', error);
    return null;
  }
}

