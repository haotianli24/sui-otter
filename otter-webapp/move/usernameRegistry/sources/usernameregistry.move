module usernameregistry::usernameregistry {
    use sui::event;
    use sui::table::{Self, Table};
    use sui::vec_set::{Self, VecSet};
    use std::string::{Self, String};

    // Error codes
    const EUsernameTooLong: u64 = 0;
    const EUsernameAlreadyTaken: u64 = 1;
    const EUsernameNotSet: u64 = 2;
    const ENotOwner: u64 = 3;
    const EInvalidUsername: u64 = 4;

    // Events
    public struct UsernameSet has copy, drop {
        user: address,
        username: String,
    }

    // Registry object that stores all username mappings
    public struct UsernameRegistry has key {
        id: UID,
        // Maps username -> user address
        username_to_user: Table<String, address>,
        // Maps user address -> username
        user_to_username: Table<address, String>,
        // Set of all usernames for uniqueness checking
        taken_usernames: VecSet<String>,
    }

    // User profile object
    public struct UserProfile has key, store {
        id: UID,
        user: address,
        username: String,
        bio: String,
        avatar_url: String,
        website: String,
        created_at: u64,
        updated_at: u64,
    }

    // Initialize the registry
    fun init(ctx: &mut TxContext) {
        let registry = UsernameRegistry {
            id: object::new(ctx),
            username_to_user: table::new(ctx),
            user_to_username: table::new(ctx),
            taken_usernames: vec_set::empty(),
        };

        transfer::share_object(registry);
    }

    // Set username for a user
    public entry fun set_username(
        registry: &mut UsernameRegistry,
        username: String,
        ctx: &mut TxContext
    ) {
        let user = tx_context::sender(ctx);
        
        // Validate username
        assert!(string::length(&username) <= 30, EUsernameTooLong);
        assert!(string::length(&username) > 0, EInvalidUsername);
        
        // Check if user already has a username and remove it
        if (table::contains(&registry.user_to_username, user)) {
            let old_username = table::remove(&mut registry.user_to_username, user);
            table::remove(&mut registry.username_to_user, old_username);
            vec_set::remove(&mut registry.taken_usernames, &old_username);
        };

        // Check if username is already taken by someone else
        assert!(!vec_set::contains(&registry.taken_usernames, &username), EUsernameAlreadyTaken);
        
        // Add new username mapping
        table::add(&mut registry.username_to_user, username, user);
        table::add(&mut registry.user_to_username, user, username);
        vec_set::insert(&mut registry.taken_usernames, username);

        // Emit event
        event::emit(UsernameSet {
            user,
            username,
        });
    }

    // Set username and create/update profile
    public entry fun set_username_with_profile(
        registry: &mut UsernameRegistry,
        username: String,
        bio: String,
        avatar_url: String,
        website: String,
        ctx: &mut TxContext
    ) {
        let user = tx_context::sender(ctx);
        
        // Validate username
        assert!(string::length(&username) <= 30, EUsernameTooLong);
        assert!(string::length(&username) > 0, EInvalidUsername);
        
        // Check if user already has a username and remove it
        if (table::contains(&registry.user_to_username, user)) {
            let old_username = table::remove(&mut registry.user_to_username, user);
            table::remove(&mut registry.username_to_user, old_username);
            vec_set::remove(&mut registry.taken_usernames, &old_username);
        };

        // Check if username is already taken by someone else
        assert!(!vec_set::contains(&registry.taken_usernames, &username), EUsernameAlreadyTaken);
        
        // Add new username mapping
        table::add(&mut registry.username_to_user, username, user);
        table::add(&mut registry.user_to_username, user, username);
        vec_set::insert(&mut registry.taken_usernames, username);

        // Create or update UserProfile object
        let profile = UserProfile {
            id: object::new(ctx),
            user,
            username,
            bio,
            avatar_url,
            website,
            created_at: tx_context::epoch_timestamp_ms(ctx),
            updated_at: tx_context::epoch_timestamp_ms(ctx),
        };

        transfer::transfer(profile, user);

        // Emit event
        event::emit(UsernameSet {
            user,
            username,
        });
    }

    // Get username for a user address
    public fun get_username(registry: &UsernameRegistry, user: address): String {
        assert!(table::contains(&registry.user_to_username, user), EUsernameNotSet);
        *table::borrow(&registry.user_to_username, user)
    }

    // Get user address for a username
    public fun get_user_by_username(registry: &UsernameRegistry, username: String): address {
        assert!(table::contains(&registry.username_to_user, username), EUsernameNotSet);
        *table::borrow(&registry.username_to_user, username)
    }

    // Check if username is available
    public fun is_username_available(registry: &UsernameRegistry, username: String): bool {
        !vec_set::contains(&registry.taken_usernames, &username)
    }

    // Create user profile
    public entry fun create_profile(
        registry: &mut UsernameRegistry,
        username: String,
        bio: String,
        avatar_url: String,
        website: String,
        ctx: &mut TxContext
    ) {
        let user = tx_context::sender(ctx);
        
        // Validate username
        assert!(string::length(&username) <= 30, EUsernameTooLong);
        assert!(string::length(&username) > 0, EInvalidUsername);
        assert!(!vec_set::contains(&registry.taken_usernames, &username), EUsernameAlreadyTaken);
        
        // Set username
        table::add(&mut registry.username_to_user, username, user);
        table::add(&mut registry.user_to_username, user, username);
        vec_set::insert(&mut registry.taken_usernames, username);

        // Create profile object
        let profile = UserProfile {
            id: object::new(ctx),
            user,
            username,
            bio,
            avatar_url,
            website,
            created_at: tx_context::epoch_timestamp_ms(ctx),
            updated_at: tx_context::epoch_timestamp_ms(ctx),
        };

        transfer::transfer(profile, user);

        // Emit event
        event::emit(UsernameSet {
            user,
            username,
        });
    }

    // Update profile
    public entry fun update_profile(
        profile: &mut UserProfile,
        bio: String,
        avatar_url: String,
        website: String,
        ctx: &mut TxContext
    ) {
        let user = tx_context::sender(ctx);
        assert!(profile.user == user, ENotOwner);

        profile.bio = bio;
        profile.avatar_url = avatar_url;
        profile.website = website;
        profile.updated_at = tx_context::epoch_timestamp_ms(ctx);
    }

    // Get profile info
    public fun get_profile_info(profile: &UserProfile): (address, String, String, String, String, u64, u64) {
        (
            profile.user,
            profile.username,
            profile.bio,
            profile.avatar_url,
            profile.website,
            profile.created_at,
            profile.updated_at,
        )
    }
}
