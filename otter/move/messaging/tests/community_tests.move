#[test_only]
module community::community_tests {
    use sui::test_scenario::{Self, Scenario};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::clock::{Self, Clock};
    use community::community::{
        Self,
        Community,
        CommunityRegistry,
        MembershipNFT,
        GroupMessage,
    };

    // Test addresses
    const ADMIN: address = @0xAD;
    const ALICE: address = @0xA1;
    const BOB: address = @0xB0;
    const CHARLIE: address = @0xC0;

    // Test constants
    const COMMUNITY_NAME: vector<u8> = b"Trading Alpha Group";
    const COMMUNITY_DESC: vector<u8> = b"Exclusive community for serious traders";
    const ENTRY_FEE: u64 = 100_000_000; // 0.1 SUI in MIST
    const MAX_MEMBERS: u64 = 100;

    #[test]
    fun test_create_paid_community() {
        let mut scenario = test_scenario::begin(ADMIN);
        let ctx = test_scenario::ctx(&mut scenario);

        // Initialize the community module
        community::init(ctx);

        // Get the registry
        let registry = test_scenario::take_shared<CommunityRegistry>(&scenario);
        let mut registry = registry;

        // Create a paid community
        community::create_community(
            &mut registry,
            COMMUNITY_NAME,
            COMMUNITY_DESC,
            ENTRY_FEE,
            MAX_MEMBERS,
            ctx,
        );

        // Verify community was created
        let community = test_scenario::take_shared<Community>(&scenario);
        assert!(community::is_paid_community(&community), 0);
        assert!(community::get_entry_fee(&community) == ENTRY_FEE, 1);
        assert!(community::get_member_count(&community) == 1, 2); // Owner is first member

        // Verify owner got membership NFT
        let membership = test_scenario::take_from_sender<MembershipNFT>(&scenario, ADMIN);
        assert!(membership.member == ADMIN, 3);

        // Return objects
        test_scenario::return_shared(community);
        test_scenario::return_shared(registry);
        test_scenario::return_to_sender(&scenario, membership);
        test_scenario::end(scenario);
    }

    #[test]
    fun test_join_community_with_payment() {
        let mut scenario = test_scenario::begin(ADMIN);
        let ctx = test_scenario::ctx(&mut scenario);

        // Initialize and create community
        community::init(ctx);
        let registry = test_scenario::take_shared<CommunityRegistry>(&scenario);
        let mut registry = registry;

        community::create_community(
            &mut registry,
            COMMUNITY_NAME,
            COMMUNITY_DESC,
            ENTRY_FEE,
            MAX_MEMBERS,
            ctx,
        );

        let community = test_scenario::take_shared<Community>(&scenario);
        let mut community = community;

        // Switch to Alice
        test_scenario::next_tx(&mut scenario, ALICE);
        let ctx = test_scenario::ctx(&mut scenario);

        // Alice creates a coin with enough SUI to pay entry fee
        let payment_coin = coin::mint_for_testing<SUI>(ENTRY_FEE, ctx);

        // Alice joins the community
        community::join_community(
            &mut registry,
            &mut community,
            payment_coin,
            ctx,
        );

        // Verify Alice got membership NFT
        let alice_membership = test_scenario::take_from_sender<MembershipNFT>(&scenario, ALICE);
        assert!(alice_membership.member == ALICE, 0);
        assert!(alice_membership.community_id == community::object::id(&community), 1);

        // Verify community member count increased
        assert!(community::get_member_count(&community) == 2, 2);

        // Verify Alice's payment went to admin
        let admin_balance = test_scenario::balance_for_sender<SUI>(&scenario, ADMIN);
        assert!(admin_balance == ENTRY_FEE, 3);

        // Return objects
        test_scenario::return_shared(community);
        test_scenario::return_shared(registry);
        test_scenario::return_to_sender(&scenario, alice_membership);
        test_scenario::end(scenario);
    }

    #[test]
    fun test_send_group_message() {
        let mut scenario = test_scenario::begin(ADMIN);
        let ctx = test_scenario::ctx(&mut scenario);

        // Initialize and create community
        community::init(ctx);
        let registry = test_scenario::take_shared<CommunityRegistry>(&scenario);
        let mut registry = registry;

        community::create_community(
            &mut registry,
            COMMUNITY_NAME,
            COMMUNITY_DESC,
            ENTRY_FEE,
            MAX_MEMBERS,
            ctx,
        );

        let community = test_scenario::take_shared<Community>(&scenario);
        let mut community = community;

        // Admin gets membership NFT
        let admin_membership = test_scenario::take_from_sender<MembershipNFT>(&scenario, ADMIN);

        // Switch to Alice and have her join
        test_scenario::next_tx(&mut scenario, ALICE);
        let ctx = test_scenario::ctx(&mut scenario);
        let payment_coin = coin::mint_for_testing<SUI>(ENTRY_FEE, ctx);
        community::join_community(&mut registry, &mut community, payment_coin, ctx);
        let alice_membership = test_scenario::take_from_sender<MembershipNFT>(&scenario, ALICE);

        // Switch back to admin to send a message
        test_scenario::next_tx(&mut scenario, ADMIN);
        let ctx = test_scenario::ctx(&mut scenario);
        let clock = clock::create_for_testing(ctx);

        // Admin sends a message
        let message_content = b"Welcome to our trading community!";
        let media_ref = b"walrus://example.com/image.jpg";
        
        community::send_group_message(
            &community,
            &admin_membership,
            message_content,
            media_ref,
            ctx,
        );

        // Verify message was created
        let message = test_scenario::take_shared<GroupMessage>(&scenario);
        assert!(message.sender == ADMIN, 0);
        assert!(message.community_id == community::object::id(&community), 1);

        // Return objects
        test_scenario::return_shared(community);
        test_scenario::return_shared(registry);
        test_scenario::return_shared(message);
        test_scenario::return_to_sender(&scenario, admin_membership);
        test_scenario::return_to_sender(&scenario, alice_membership);
        test_scenario::end(scenario);
    }

    #[test]
    fun test_insufficient_payment_fails() {
        let mut scenario = test_scenario::begin(ADMIN);
        let ctx = test_scenario::ctx(&mut scenario);

        // Initialize and create community
        community::init(ctx);
        let registry = test_scenario::take_shared<CommunityRegistry>(&scenario);
        let mut registry = registry;

        community::create_community(
            &mut registry,
            COMMUNITY_NAME,
            COMMUNITY_DESC,
            ENTRY_FEE,
            MAX_MEMBERS,
            ctx,
        );

        let community = test_scenario::take_shared<Community>(&scenario);
        let mut community = community;

        // Switch to Alice
        test_scenario::next_tx(&mut scenario, ALICE);
        let ctx = test_scenario::ctx(&mut scenario);

        // Alice creates a coin with insufficient SUI
        let insufficient_payment = coin::mint_for_testing<SUI>(ENTRY_FEE / 2, ctx);

        // This should fail
        test_scenario::next_tx(&mut scenario, ALICE);
        let ctx = test_scenario::ctx(&mut scenario);
        
        // We expect this to abort with EInvalidPayment
        test_scenario::expect_abort(
            community::join_community(
                &mut registry,
                &mut community,
                insufficient_payment,
                ctx,
            ),
            community::EInvalidPayment,
        );

        // Return objects
        test_scenario::return_shared(community);
        test_scenario::return_shared(registry);
        test_scenario::end(scenario);
    }

    #[test]
    fun test_community_full_fails() {
        let mut scenario = test_scenario::begin(ADMIN);
        let ctx = test_scenario::ctx(&mut scenario);

        // Initialize and create community with max 2 members
        community::init(ctx);
        let registry = test_scenario::take_shared<CommunityRegistry>(&scenario);
        let mut registry = registry;

        community::create_community(
            &mut registry,
            COMMUNITY_NAME,
            COMMUNITY_DESC,
            ENTRY_FEE,
            2, // Only 2 members max
            ctx,
        );

        let community = test_scenario::take_shared<Community>(&scenario);
        let mut community = community;

        // Alice joins (member 2)
        test_scenario::next_tx(&mut scenario, ALICE);
        let ctx = test_scenario::ctx(&mut scenario);
        let alice_payment = coin::mint_for_testing<SUI>(ENTRY_FEE, ctx);
        community::join_community(&mut registry, &mut community, alice_payment, ctx);
        let _alice_membership = test_scenario::take_from_sender<MembershipNFT>(&scenario, ALICE);

        // Bob tries to join (would be member 3, but max is 2)
        test_scenario::next_tx(&mut scenario, BOB);
        let ctx = test_scenario::ctx(&mut scenario);
        let bob_payment = coin::mint_for_testing<SUI>(ENTRY_FEE, ctx);

        // This should fail
        test_scenario::expect_abort(
            community::join_community(
                &mut registry,
                &mut community,
                bob_payment,
                ctx,
            ),
            community::ECommunityFull,
        );

        // Return objects
        test_scenario::return_shared(community);
        test_scenario::return_shared(registry);
        test_scenario::end(scenario);
    }

    #[test]
    fun test_transfer_ownership() {
        let mut scenario = test_scenario::begin(ADMIN);
        let ctx = test_scenario::ctx(&mut scenario);

        // Initialize and create community
        community::init(ctx);
        let registry = test_scenario::take_shared<CommunityRegistry>(&scenario);
        let mut registry = registry;

        community::create_community(
            &mut registry,
            COMMUNITY_NAME,
            COMMUNITY_DESC,
            ENTRY_FEE,
            MAX_MEMBERS,
            ctx,
        );

        let community = test_scenario::take_shared<Community>(&scenario);
        let mut community = community;

        // Admin transfers ownership to Alice
        community::transfer_ownership(
            &mut community,
            ALICE,
            ctx,
        );

        // Verify ownership changed
        assert!(community.owner == ALICE, 0);

        // Return objects
        test_scenario::return_shared(community);
        test_scenario::return_shared(registry);
        test_scenario::end(scenario);
    }

    #[test]
    fun test_non_owner_cannot_transfer_ownership() {
        let mut scenario = test_scenario::begin(ADMIN);
        let ctx = test_scenario::ctx(&mut scenario);

        // Initialize and create community
        community::init(ctx);
        let registry = test_scenario::take_shared<CommunityRegistry>(&scenario);
        let mut registry = registry;

        community::create_community(
            &mut registry,
            COMMUNITY_NAME,
            COMMUNITY_DESC,
            ENTRY_FEE,
            MAX_MEMBERS,
            ctx,
        );

        let community = test_scenario::take_shared<Community>(&scenario);
        let mut community = community;

        // Alice tries to transfer ownership (but she's not the owner)
        test_scenario::next_tx(&mut scenario, ALICE);
        let ctx = test_scenario::ctx(&mut scenario);

        // This should fail
        test_scenario::expect_abort(
            community::transfer_ownership(
                &mut community,
                BOB,
                ctx,
            ),
            community::ENotOwner,
        );

        // Return objects
        test_scenario::return_shared(community);
        test_scenario::return_shared(registry);
        test_scenario::end(scenario);
    }

    #[test]
    fun test_non_member_cannot_send_message() {
        let mut scenario = test_scenario::begin(ADMIN);
        let ctx = test_scenario::ctx(&mut scenario);

        // Initialize and create community
        community::init(ctx);
        let registry = test_scenario::take_shared<CommunityRegistry>(&scenario);
        let mut registry = registry;

        community::create_community(
            &mut registry,
            COMMUNITY_NAME,
            COMMUNITY_DESC,
            ENTRY_FEE,
            MAX_MEMBERS,
            ctx,
        );

        let community = test_scenario::take_shared<Community>(&scenario);
        let admin_membership = test_scenario::take_from_sender<MembershipNFT>(&scenario, ADMIN);

        // Bob tries to send a message without being a member
        test_scenario::next_tx(&mut scenario, BOB);
        let ctx = test_scenario::ctx(&mut scenario);
        let clock = clock::create_for_testing(ctx);

        // Create a fake membership NFT (wrong community)
        let fake_membership = MembershipNFT {
            id: sui::object::new(ctx),
            community_id: sui::object::id(&community), // Same community ID
            member: BOB, // But Bob is not a member
            joined_at: 0,
        };

        // This should fail because Bob is not a member
        test_scenario::expect_abort(
            community::send_group_message(
                &community,
                &fake_membership,
                b"Hello everyone!",
                b"",
                ctx,
            ),
            community::ENotMember,
        );

        // Return objects
        test_scenario::return_shared(community);
        test_scenario::return_shared(registry);
        test_scenario::return_to_sender(&scenario, admin_membership);
        test_scenario::end(scenario);
    }

    #[test]
    fun test_create_free_community() {
        let mut scenario = test_scenario::begin(ADMIN);
        let ctx = test_scenario::ctx(&mut scenario);

        // Initialize
        community::init(ctx);
        let registry = test_scenario::take_shared<CommunityRegistry>(&scenario);
        let mut registry = registry;

        // Create a free community (entry_fee = 0)
        community::create_community(
            &mut registry,
            b"Free Trading Group",
            b"Open community for all traders",
            0, // Free community
            MAX_MEMBERS,
            ctx,
        );

        let community = test_scenario::take_shared<Community>(&scenario);
        assert!(!community::is_paid_community(&community), 0);
        assert!(community::get_entry_fee(&community) == 0, 1);

        // Test joining free community
        test_scenario::next_tx(&mut scenario, ALICE);
        let ctx = test_scenario::ctx(&mut scenario);
        let zero_coin = coin::mint_for_testing<SUI>(0, ctx); // 0-value coin

        community::join_community(
            &mut registry,
            &mut community,
            zero_coin,
            ctx,
        );

        // Verify Alice got membership NFT
        let alice_membership = test_scenario::take_from_sender<MembershipNFT>(&scenario, ALICE);
        assert!(alice_membership.member == ALICE, 2);

        // Return objects
        test_scenario::return_shared(community);
        test_scenario::return_shared(registry);
        test_scenario::return_to_sender(&scenario, alice_membership);
        test_scenario::end(scenario);
    }
}
