/// Copy Trading Module
/// Allows users to automatically copy trades from professional traders
module copy_trading::copy_trading {
    use sui::object::{Self, UID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::table::{Self, Table};
    use sui::event;
    use std::string::String;

    /// Errors
    const ENotFollower: u64 = 1;
    const EAlreadyFollowing: u64 = 2;
    const EInvalidCopyPercentage: u64 = 3;
    const EInsufficientBalance: u64 = 4;
    const ECopyingDisabled: u64 = 5;

    /// Copy trading relationship
    public struct FollowerRelationship has key, store {
        id: UID,
        follower: address,
        trader: address,
        copy_percentage: u64, // Percentage of trader's position to copy (0-100)
        max_trade_size: u64, // Maximum amount per trade in MIST
        auto_copy_enabled: bool,
        total_trades_copied: u64,
        created_at: u64,
    }

    /// Global registry of all copy trading relationships
    public struct CopyTradingRegistry has key {
        id: UID,
        relationships: Table<address, vector<FollowerRelationship>>, // follower -> relationships
        trader_followers: Table<address, vector<address>>, // trader -> followers
        total_relationships: u64,
    }

    /// Trade execution record
    public struct TradeRecord has key, store {
        id: UID,
        trader: address,
        follower: address,
        trade_type: String, // "swap", "transfer", etc.
        amount: u64,
        timestamp: u64,
        success: bool,
    }

    /// Events
    public struct FollowTraderEvent has copy, drop {
        follower: address,
        trader: address,
        copy_percentage: u64,
        timestamp: u64,
    }

    public struct UnfollowTraderEvent has copy, drop {
        follower: address,
        trader: address,
        timestamp: u64,
    }

    public struct TradeCopiedEvent has copy, drop {
        trader: address,
        follower: address,
        trade_type: String,
        amount: u64,
        timestamp: u64,
    }

    public struct SettingsUpdatedEvent has copy, drop {
        follower: address,
        trader: address,
        copy_percentage: u64,
        auto_copy_enabled: bool,
        timestamp: u64,
    }

    /// Initialize the copy trading registry
    fun init(ctx: &mut TxContext) {
        let registry = CopyTradingRegistry {
            id: object::new(ctx),
            relationships: table::new(ctx),
            trader_followers: table::new(ctx),
            total_relationships: 0,
        };
        transfer::share_object(registry);
    }

    /// Follow a trader and start copying their trades
    public entry fun follow_trader(
        registry: &mut CopyTradingRegistry,
        trader: address,
        copy_percentage: u64,
        max_trade_size: u64,
        ctx: &mut TxContext
    ) {
        let follower = tx_context::sender(ctx);
        
        // Validate inputs
        assert!(copy_percentage > 0 && copy_percentage <= 100, EInvalidCopyPercentage);
        assert!(follower != trader, EAlreadyFollowing);

        // Create relationship
        let relationship = FollowerRelationship {
            id: object::new(ctx),
            follower,
            trader,
            copy_percentage,
            max_trade_size,
            auto_copy_enabled: true,
            total_trades_copied: 0,
            created_at: tx_context::epoch_timestamp_ms(ctx),
        };

        // Add to follower's relationships
        if (!table::contains(&registry.relationships, follower)) {
            table::add(&mut registry.relationships, follower, vector::empty());
        };
        let relationships = table::borrow_mut(&mut registry.relationships, follower);
        vector::push_back(relationships, relationship);

        // Add to trader's followers
        if (!table::contains(&registry.trader_followers, trader)) {
            table::add(&mut registry.trader_followers, trader, vector::empty());
        };
        let followers = table::borrow_mut(&mut registry.trader_followers, trader);
        vector::push_back(followers, follower);

        registry.total_relationships = registry.total_relationships + 1;

        // Emit event
        event::emit(FollowTraderEvent {
            follower,
            trader,
            copy_percentage,
            timestamp: tx_context::epoch_timestamp_ms(ctx),
        });
    }

    /// Unfollow a trader
    public entry fun unfollow_trader(
        registry: &mut CopyTradingRegistry,
        trader: address,
        ctx: &mut TxContext
    ) {
        let follower = tx_context::sender(ctx);
        
        assert!(table::contains(&registry.relationships, follower), ENotFollower);

        // Remove from follower's relationships
        let relationships = table::borrow_mut(&mut registry.relationships, follower);
        let (found, idx) = find_relationship(relationships, trader);
        assert!(found, ENotFollower);
        
        let FollowerRelationship { id, follower: _, trader: _, copy_percentage: _, max_trade_size: _, auto_copy_enabled: _, total_trades_copied: _, created_at: _ } = vector::swap_remove(relationships, idx);
        object::delete(id);
        
        // Remove from trader's followers
        if (table::contains(&registry.trader_followers, trader)) {
            let followers = table::borrow_mut(&mut registry.trader_followers, trader);
            let (found_follower, follower_idx) = vector::index_of(followers, &follower);
            if (found_follower) {
                vector::swap_remove(followers, follower_idx);
            };
        };

        registry.total_relationships = registry.total_relationships - 1;

        // Emit event
        event::emit(UnfollowTraderEvent {
            follower,
            trader,
            timestamp: tx_context::epoch_timestamp_ms(ctx),
        });
    }

    /// Update copy trading settings
    public entry fun update_settings(
        registry: &mut CopyTradingRegistry,
        trader: address,
        copy_percentage: u64,
        max_trade_size: u64,
        auto_copy_enabled: bool,
        ctx: &mut TxContext
    ) {
        let follower = tx_context::sender(ctx);
        
        assert!(copy_percentage > 0 && copy_percentage <= 100, EInvalidCopyPercentage);
        assert!(table::contains(&registry.relationships, follower), ENotFollower);

        let relationships = table::borrow_mut(&mut registry.relationships, follower);
        let (found, idx) = find_relationship(relationships, trader);
        assert!(found, ENotFollower);

        let relationship = vector::borrow_mut(relationships, idx);
        relationship.copy_percentage = copy_percentage;
        relationship.max_trade_size = max_trade_size;
        relationship.auto_copy_enabled = auto_copy_enabled;

        // Emit event
        event::emit(SettingsUpdatedEvent {
            follower,
            trader,
            copy_percentage,
            auto_copy_enabled,
            timestamp: tx_context::epoch_timestamp_ms(ctx),
        });
    }

    /// Execute a copy trade (called by the agent)
    public entry fun execute_copy_trade(
        registry: &mut CopyTradingRegistry,
        trader: address,
        follower: address,
        trade_type: vector<u8>,
        amount: u64,
        payment: Coin<SUI>,
        ctx: &mut TxContext
    ) {
        assert!(table::contains(&registry.relationships, follower), ENotFollower);

        let relationships = table::borrow_mut(&mut registry.relationships, follower);
        let (found, idx) = find_relationship(relationships, trader);
        assert!(found, ENotFollower);

        let relationship = vector::borrow_mut(relationships, idx);
        assert!(relationship.auto_copy_enabled, ECopyingDisabled);

        // Calculate copy amount based on percentage
        let mut copy_amount = (amount * relationship.copy_percentage) / 100;
        
        // Ensure it doesn't exceed max trade size
        if (copy_amount > relationship.max_trade_size) {
            copy_amount = relationship.max_trade_size;
        };

        // Verify payment is sufficient
        assert!(coin::value(&payment) >= copy_amount, EInsufficientBalance);

        // Execute the trade (simplified - in production would interact with DEX)
        // For now, just take the payment and emit event
        transfer::public_transfer(payment, follower); // Return payment for now

        // Update stats
        relationship.total_trades_copied = relationship.total_trades_copied + 1;

        // Create trade record
        let record = TradeRecord {
            id: object::new(ctx),
            trader,
            follower,
            trade_type: std::string::utf8(trade_type),
            amount: copy_amount,
            timestamp: tx_context::epoch_timestamp_ms(ctx),
            success: true,
        };
        transfer::share_object(record);

        // Emit event
        event::emit(TradeCopiedEvent {
            trader,
            follower,
            trade_type: std::string::utf8(trade_type),
            amount: copy_amount,
            timestamp: tx_context::epoch_timestamp_ms(ctx),
        });
    }

    /// Helper function to find relationship index
    fun find_relationship(relationships: &vector<FollowerRelationship>, trader: address): (bool, u64) {
        let len = vector::length(relationships);
        let mut i = 0;
        while (i < len) {
            let rel = vector::borrow(relationships, i);
            if (rel.trader == trader) {
                return (true, i)
            };
            i = i + 1;
        };
        (false, 0)
    }

    /// View function: Get followers of a trader
    public fun get_follower_count(registry: &CopyTradingRegistry, trader: address): u64 {
        if (table::contains(&registry.trader_followers, trader)) {
            let followers = table::borrow(&registry.trader_followers, trader);
            vector::length(followers)
        } else {
            0
        }
    }

    /// View function: Check if following a trader
    public fun is_following(registry: &CopyTradingRegistry, follower: address, trader: address): bool {
        if (table::contains(&registry.relationships, follower)) {
            let relationships = table::borrow(&registry.relationships, follower);
            let (found, _) = find_relationship(relationships, trader);
            found
        } else {
            false
        }
    }
}

