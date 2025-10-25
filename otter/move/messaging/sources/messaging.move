/*
/// Module: messaging
module messaging::messaging;
*/

// For Move coding conventions, see
// https://docs.sui.io/concepts/sui-move-concepts/conventions


module messaging::messaging {
    use std::string::String;
    use sui::coin::Coin;
    use sui::sui::SUI;
    use sui::clock::Clock;

    // ===== Constants =====
    
    const ENotAuthorized: u64 = 0;
    const EInvalidRecipient: u64 = 1;
    const EEmptyContent: u64 = 2;
    const EInvalidAddress: u64 = 3;

    // ===== Structs =====

    /// Represents a direct message channel between two users
    public struct Channel has key, store {
        id: UID,
        user1: address,
        user2: address,
        encrypted: bool,
    }

    /// Represents a single message
    public struct Message has key, store {
        id: UID,
        channel_id: address,
        sender: address,
        content: String,  // Encrypted content (use Seal)
        media_ref: String,  // Walrus storage reference
        timestamp: u64,
    }

    /// Message registry to track all channels
    public struct MessageRegistry has key {
        id: UID,
        channel_count: u64,
    }

    // ===== Events =====

    public struct ChannelCreated has copy, drop {
        channel_id: address,
        user1: address,
        user2: address,
    }

    public struct MessageSent has copy, drop {
        message_id: address,
        channel_id: address,
        sender: address,
        timestamp: u64,
    }

    public struct CryptoSent has copy, drop {
        from: address,
        to: address,
        amount: u64,
    }

    // ===== Init Function =====

    fun init(ctx: &mut TxContext) {
        let registry = MessageRegistry {
            id: sui::object::new(ctx),
            channel_count: 0,
        };
        sui::transfer::share_object(registry);
    }

    // ===== Public Functions =====

    /// Create a new direct message channel between two users
    public entry fun create_channel(
        registry: &mut MessageRegistry,
        recipient: address,
        ctx: &mut TxContext
    ) {
        let sender = sui::tx_context::sender(ctx);
        
        // Validate recipient is not the same as sender
        assert!(sender != recipient, EInvalidRecipient);
        
        // Validate recipient address is not zero
        assert!(recipient != @0x0, EInvalidAddress);
        
        let channel = Channel {
            id: sui::object::new(ctx),
            user1: sender,
            user2: recipient,
            encrypted: true,
        };

        let channel_id = sui::object::uid_to_address(&channel.id);
        
        sui::event::emit(ChannelCreated {
            channel_id,
            user1: sender,
            user2: recipient,
        });

        registry.channel_count = registry.channel_count + 1;
        sui::transfer::share_object(channel);
    }

    /// Send a message in a channel
    public entry fun send_message(
        channel: &Channel,
        content: vector<u8>,
        media_ref: vector<u8>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let sender = sui::tx_context::sender(ctx);
        
        // Verify sender is part of the channel
        assert!(sender == channel.user1 || sender == channel.user2, ENotAuthorized);
        
        // Validate content is not empty
        assert!(std::vector::length(&content) > 0, EEmptyContent);

        let timestamp = sui::clock::timestamp_ms(clock);
        
        let message = Message {
            id: sui::object::new(ctx),
            channel_id: sui::object::uid_to_address(&channel.id),
            sender,
            content: std::string::utf8(content),
            media_ref: std::string::utf8(media_ref),
            timestamp,
        };

        let message_id = sui::object::uid_to_address(&message.id);

        sui::event::emit(MessageSent {
            message_id,
            channel_id: sui::object::uid_to_address(&channel.id),
            sender,
            timestamp,
        });

        sui::transfer::share_object(message);
    }

    /// Send SUI to another user (for /send command)
    public entry fun send_crypto(
        channel: &Channel,
        payment: Coin<SUI>,
        ctx: &mut TxContext
    ) {
        let sender = sui::tx_context::sender(ctx);
        let amount = sui::coin::value(&payment);
        
        // Verify sender is part of the channel
        assert!(sender == channel.user1 || sender == channel.user2, ENotAuthorized);
        
        // Determine recipient
        let recipient = if (sender == channel.user1) {
            channel.user2
        } else {
            channel.user1
        };

        sui::event::emit(CryptoSent {
            from: sender,
            to: recipient,
            amount,
        });

        sui::transfer::public_transfer(payment, recipient);
    }

    // ===== View Functions =====

    /// Get the channel count from the registry
    public fun get_channel_count(registry: &MessageRegistry): u64 {
        registry.channel_count
    }
}