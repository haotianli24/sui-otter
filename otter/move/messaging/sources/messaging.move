/*
/// Module: messaging
module messaging::messaging;
*/

// For Move coding conventions, see
// https://docs.sui.io/concepts/sui-move-concepts/conventions


module messaging::messaging {
    use sui::object::{Self, UID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use std::string::{Self, String};
    use sui::event;
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;

    // ===== Structs =====

    /// Represents a direct message channel between two users
    struct Channel has key, store {
        id: UID,
        user1: address,
        user2: address,
        encrypted: bool,
    }

    /// Represents a single message
    struct Message has key, store {
        id: UID,
        channel_id: address,
        sender: address,
        content: String,  // Encrypted content (use Seal)
        media_ref: String,  // Walrus storage reference
        timestamp: u64,
    }

    /// Message registry to track all channels
    struct MessageRegistry has key {
        id: UID,
        channel_count: u64,
    }

    // ===== Events =====

    struct ChannelCreated has copy, drop {
        channel_id: address,
        user1: address,
        user2: address,
    }

    struct MessageSent has copy, drop {
        message_id: address,
        channel_id: address,
        sender: address,
        timestamp: u64,
    }

    struct CryptoSent has copy, drop {
        from: address,
        to: address,
        amount: u64,
    }

    // ===== Init Function =====

    fun init(ctx: &mut TxContext) {
        let registry = MessageRegistry {
            id: object::new(ctx),
            channel_count: 0,
        };
        transfer::share_object(registry);
    }

    // ===== Public Functions =====

    /// Create a new direct message channel between two users
    public entry fun create_channel(
        registry: &mut MessageRegistry,
        recipient: address,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        
        let channel = Channel {
            id: object::new(ctx),
            user1: sender,
            user2: recipient,
            encrypted: true,
        };

        let channel_id = object::uid_to_address(&channel.id);
        
        event::emit(ChannelCreated {
            channel_id,
            user1: sender,
            user2: recipient,
        });

        registry.channel_count = registry.channel_count + 1;
        transfer::share_object(channel);
    }

    /// Send a message in a channel
    public entry fun send_message(
        channel: &Channel,
        content: vector<u8>,
        media_ref: vector<u8>,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        
        // Verify sender is part of the channel
        assert!(sender == channel.user1 || sender == channel.user2, 0);

        let message = Message {
            id: object::new(ctx),
            channel_id: object::uid_to_address(&channel.id),
            sender,
            content: string::utf8(content),
            media_ref: string::utf8(media_ref),
            timestamp: tx_context::epoch(ctx),
        };

        let message_id = object::uid_to_address(&message.id);

        event::emit(MessageSent {
            message_id,
            channel_id: object::uid_to_address(&channel.id),
            sender,
            timestamp: tx_context::epoch(ctx),
        });

        transfer::share_object(message);
    }

    /// Send SUI to another user (for /send command)
    public entry fun send_crypto(
        channel: &Channel,
        payment: Coin<SUI>,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        let amount = coin::value(&payment);
        
        // Verify sender is part of the channel
        assert!(sender == channel.user1 || sender == channel.user2, 0);
        
        // Determine recipient
        let recipient = if (sender == channel.user1) {
            channel.user2
        } else {
            channel.user1
        };

        event::emit(CryptoSent {
            from: sender,
            to: recipient,
            amount,
        });

        transfer::public_transfer(payment, recipient);
    }
}