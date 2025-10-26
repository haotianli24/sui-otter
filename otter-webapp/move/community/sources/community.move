/*
/// Module: community
module community::community;
*/

// For Move coding conventions, see
// https://docs.sui.io/concepts/sui-move-concepts/conventions


/*
/// Module: community
module community::community;
*/

// For Move coding conventions, see
// https://docs.sui.io/concepts/sui-move-concepts/conventions


module community::community {
    use sui::object::{Self, UID, ID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use std::string::{Self, String};
    use sui::event;
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::table::{Self, Table};
    use sui::clock::{Self, Clock};
    use std::vector;

    // ===== Error Codes =====
    const ENotOwner: u64 = 0;
    const ENotMember: u64 = 1;
    const EInvalidPayment: u64 = 2;
    const ECommunityFull: u64 = 4;
    const EInsufficientTokenBalance: u64 = 5;
    const EInvalidTokenType: u64 = 6;
    const ENotDAOCommunity: u64 = 7;

    // ===== Structs =====

    /// Represents a community (group chat)
    public struct Community has key, store {
        id: UID,
        name: String,
        description: String,
        owner: address,
        is_paid: bool,
        entry_fee: u64,  // Fee in MIST (1 SUI = 1_000_000_000 MIST)
        member_count: u64,
        max_members: u64,
        created_at: u64,
        // DAO-specific fields
        is_dao: bool,
        dao_token_type: String,  // Token type identifier (e.g., "0x2::sui::SUI", "0x...::USDC")
        dao_token_threshold: u64,  // Minimum token amount required
    }

    /// Membership NFT - proves user is part of community
    public struct MembershipNFT has key, store {
        id: UID,
        community_id: ID,
        member: address,
        joined_at: u64,
    }

    /// Community registry to track all communities
    public struct CommunityRegistry has key {
        id: UID,
        community_count: u64,
        members: Table<ID, vector<address>>,  // community_id -> member addresses
    }

    /// Group message
    public struct GroupMessage has key, store {
        id: UID,
        community_id: ID,
        sender: address,
        content: String,  // Encrypted content (use Seal)
        media_ref: String,  // Walrus storage reference
        timestamp: u64,
    }

    // ===== Events =====

    public struct CommunityCreated has copy, drop {
        community_id: ID,
        owner: address,
        name: String,
        is_paid: bool,
        entry_fee: u64,
    }

    public struct MemberJoined has copy, drop {
        community_id: ID,
        member: address,
        paid_amount: u64,
        timestamp: u64,
    }

    public struct MemberLeft has copy, drop {
        community_id: ID,
        member: address,
        timestamp: u64,
    }

    public struct GroupMessageSent has copy, drop {
        message_id: ID,
        community_id: ID,
        sender: address,
        timestamp: u64,
    }

    public struct OwnershipTransferred has copy, drop {
        community_id: ID,
        old_owner: address,
        new_owner: address,
    }

    public struct DAOCommunityCreated has copy, drop {
        community_id: ID,
        owner: address,
        name: String,
        token_type: String,
        token_threshold: u64,
    }

    public struct DAOMemberJoined has copy, drop {
        community_id: ID,
        member: address,
        token_balance: u64,
        timestamp: u64,
    }

    // ===== Init Function =====

    fun init(ctx: &mut TxContext) {
        let registry = CommunityRegistry {
            id: object::new(ctx),
            community_count: 0,
            members: table::new(ctx),
        };
        transfer::share_object(registry);
    }

    // ===== Public Functions =====

    /// Create a new community (free if entry_fee = 0, paid otherwise)
    public entry fun create_community(
        registry: &mut CommunityRegistry,
        name: vector<u8>,
        description: vector<u8>,
        entry_fee: u64,  // Set to 0 for free community
        max_members: u64,
        ctx: &mut TxContext
    ) {
        let owner = tx_context::sender(ctx);
        let is_paid = entry_fee > 0;
        
        let community = Community {
            id: object::new(ctx),
            name: string::utf8(name),
            description: string::utf8(description),
            owner,
            is_paid,
            entry_fee,
            member_count: 1,  // Owner is first member
            max_members,
            created_at: tx_context::epoch(ctx),
            is_dao: false,
            dao_token_type: string::utf8(b""),
            dao_token_threshold: 0,
        };

        let community_id = object::id(&community);

        // Create owner's membership NFT
        let membership = MembershipNFT {
            id: object::new(ctx),
            community_id,
            member: owner,
            joined_at: tx_context::epoch(ctx),
        };

        // Initialize member list
        table::add(&mut registry.members, community_id, vector[owner]);
        registry.community_count = registry.community_count + 1;

        event::emit(CommunityCreated {
            community_id,
            owner,
            name: string::utf8(name),
            is_paid,
            entry_fee,
        });

        event::emit(MemberJoined {
            community_id,
            member: owner,
            paid_amount: 0,
            timestamp: tx_context::epoch(ctx),
        });

        transfer::share_object(community);
        transfer::transfer(membership, owner);
    }

    /// Create a new DAO community (token-gated)
    public entry fun create_dao_community(
        registry: &mut CommunityRegistry,
        name: vector<u8>,
        description: vector<u8>,
        token_type: vector<u8>,  // Token type identifier as string
        token_threshold: u64,  // Minimum token amount required
        max_members: u64,
        ctx: &mut TxContext
    ) {
        let owner = tx_context::sender(ctx);
        
        let community = Community {
            id: object::new(ctx),
            name: string::utf8(name),
            description: string::utf8(description),
            owner,
            is_paid: false,  // DAO communities don't use SUI payments
            entry_fee: 0,
            member_count: 1,  // Owner is first member
            max_members,
            created_at: tx_context::epoch(ctx),
            is_dao: true,
            dao_token_type: string::utf8(token_type),
            dao_token_threshold: token_threshold,
        };

        let community_id = object::id(&community);

        // Create owner's membership NFT
        let membership = MembershipNFT {
            id: object::new(ctx),
            community_id,
            member: owner,
            joined_at: tx_context::epoch(ctx),
        };

        // Initialize member list
        table::add(&mut registry.members, community_id, vector[owner]);
        registry.community_count = registry.community_count + 1;

        event::emit(DAOCommunityCreated {
            community_id,
            owner,
            name: string::utf8(name),
            token_type: string::utf8(token_type),
            token_threshold,
        });

        event::emit(MemberJoined {
            community_id,
            member: owner,
            paid_amount: 0,
            timestamp: tx_context::epoch(ctx),
        });

        transfer::share_object(community);
        transfer::transfer(membership, owner);
    }

    /// Join a community (provide payment coin if paid, can be 0-value coin for free)
    public entry fun join_community(
        registry: &mut CommunityRegistry,
        community: &mut Community,
        payment: Coin<SUI>,
        ctx: &mut TxContext
    ) {
        let member = tx_context::sender(ctx);
        let community_id = object::id(community);
        
        // Check member limit
        assert!(community.member_count < community.max_members, ECommunityFull);
        
        let paid_amount = coin::value(&payment);
        
        // If paid community, verify payment and send to owner
        if (community.is_paid) {
            assert!(paid_amount >= community.entry_fee, EInvalidPayment);
            // Send payment directly to community owner
            transfer::public_transfer(payment, community.owner);
        } else {
            // Free community - return the coin to sender
            transfer::public_transfer(payment, member);
        };

        // Create membership NFT
        let membership = MembershipNFT {
            id: object::new(ctx),
            community_id,
            member,
            joined_at: tx_context::epoch(ctx),
        };

        // Add to member list
        let members = table::borrow_mut(&mut registry.members, community_id);
        vector::push_back(members, member);
        
        community.member_count = community.member_count + 1;

        event::emit(MemberJoined {
            community_id,
            member,
            paid_amount: if (community.is_paid) { paid_amount } else { 0 },
            timestamp: tx_context::epoch(ctx),
        });

        transfer::transfer(membership, member);
    }

    /// Join a DAO community by proving SUI token ownership
    public entry fun join_dao_community_sui(
        registry: &mut CommunityRegistry,
        community: &mut Community,
        sui_coin: Coin<SUI>,  // Proof of SUI token ownership
        ctx: &mut TxContext
    ) {
        let member = tx_context::sender(ctx);
        let community_id = object::id(community);
        
        // Verify this is a DAO community
        assert!(community.is_dao, ENotDAOCommunity);
        
        // Verify token type matches SUI
        assert!(community.dao_token_type == string::utf8(b"0x2::sui::SUI"), EInvalidTokenType);
        
        // Check member limit
        assert!(community.member_count < community.max_members, ECommunityFull);
        
        // Verify token balance meets threshold
        let token_amount = coin::value(&sui_coin);
        assert!(token_amount >= community.dao_token_threshold, EInsufficientTokenBalance);

        // Create membership NFT
        let membership = MembershipNFT {
            id: object::new(ctx),
            community_id,
            member,
            joined_at: tx_context::epoch(ctx),
        };

        // Add to member list
        let members = table::borrow_mut(&mut registry.members, community_id);
        vector::push_back(members, member);
        
        community.member_count = community.member_count + 1;

        event::emit(DAOMemberJoined {
            community_id,
            member,
            token_balance: token_amount,
            timestamp: tx_context::epoch(ctx),
        });

        // Return the coin to the user (they keep their tokens)
        transfer::public_transfer(sui_coin, member);
        transfer::transfer(membership, member);
    }

    /// Send a message in the group
    public entry fun send_group_message(
        community: &Community,
        _membership: &MembershipNFT,  // Proof of membership
        content: vector<u8>,
        media_ref: vector<u8>,
        clock: &Clock,  // Add Clock parameter for precise timestamps
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        let community_id = object::id(community);

        // Verify membership NFT matches community
        assert!(_membership.community_id == community_id, ENotMember);
        assert!(_membership.member == sender, ENotMember);

        let message = GroupMessage {
            id: object::new(ctx),
            community_id,
            sender,
            content: string::utf8(content),
            media_ref: string::utf8(media_ref),
            timestamp: clock::timestamp_ms(clock), // Use Clock timestamp for millisecond precision
        };

        let message_id = object::id(&message);

        event::emit(GroupMessageSent {
            message_id,
            community_id,
            sender,
            timestamp: clock::timestamp_ms(clock), // Use Clock timestamp for events too
        });

        transfer::share_object(message);
    }

    /// Transfer ownership of the community
    public entry fun transfer_ownership(
        community: &mut Community,
        new_owner: address,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        assert!(sender == community.owner, ENotOwner);

        let old_owner = community.owner;
        community.owner = new_owner;

        event::emit(OwnershipTransferred {
            community_id: object::id(community),
            old_owner,
            new_owner,
        });
    }

    /// Update community description
    public entry fun update_description(
        community: &mut Community,
        new_description: vector<u8>,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        assert!(sender == community.owner, ENotOwner);

        community.description = string::utf8(new_description);
    }

    // ===== View Functions =====

    public fun get_member_count(community: &Community): u64 {
        community.member_count
    }

    public fun is_paid_community(community: &Community): bool {
        community.is_paid
    }

    public fun get_entry_fee(community: &Community): u64 {
        community.entry_fee
    }

    public fun is_dao_community(community: &Community): bool {
        community.is_dao
    }

    public fun get_dao_token_threshold(community: &Community): u64 {
        community.dao_token_threshold
    }

    public fun get_dao_token_type(community: &Community): String {
        community.dao_token_type
    }

    /// Check if a user can join a DAO community based on their SUI token balance
    public fun can_join_dao_community_sui(community: &Community, sui_coin: &Coin<SUI>): bool {
        if (!community.is_dao) {
            return false
        };
        
        if (community.dao_token_type != string::utf8(b"0x2::sui::SUI")) {
            return false
        };
        
        let token_amount = coin::value(sui_coin);
        token_amount >= community.dao_token_threshold
    }
}