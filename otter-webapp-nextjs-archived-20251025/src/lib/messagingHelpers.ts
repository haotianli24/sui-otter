// src/lib/messagingHelpers.ts
export async function createOrGetDirectChannel(client: any, senderSigner: any, recipientAddress: string) {
    // Try to find an existing channel between these two users
    // Your app should store a mapping of active channel IDs by participant pairs
  
    // If not found, create a new channel:
    const { channelId, encryptedKeyBytes } = await client.messaging.executeCreateChannelTransaction({
      signer: senderSigner,                    // The initiating user's signer (wallet/session key)
      initialMembers: [recipientAddress],
    });
    return { channelId, encryptedKeyBytes };
  }
  

  export async function getChannelMemberCapAndKey(client: any, channelId: string, userAddress: string) {
    // Fetch member cap (find the user's membership by address)
    let cursor = null, supportMembership = null, hasNextPage = true;
    while (hasNextPage && !supportMembership) {
      const memberships: any = await client.messaging.getChannelMemberships({
        address: userAddress,
        cursor,
      });
      supportMembership = memberships.memberships.find((m: any) => m.channel_id === channelId);
      hasNextPage = memberships.hasNextPage;
      cursor = memberships.cursor;
    }
  
    const memberCapId = supportMembership.member_cap_id;
  
    // Fetch encryption key object
    const channelObjects = await client.messaging.getChannelObjectsByChannelIds({
      channelIds: [channelId],
      userAddress,
    });
    const channelObj = channelObjects[0];
    const channelEncryptionKey = {
      $kind: "Encrypted",
      encryptedBytes: new Uint8Array(channelObj.encryption_key_history.latest),
      version: channelObj.encryption_key_history.latest_version,
    };
    return { memberCapId, channelEncryptionKey };
  }

  export async function sendDirectMessage({
    client,
    signer,
    channelId,
    memberCapId,
    message,
    encryptedKey,
  }: {
    client: any;
    signer: any;
    channelId: string;
    memberCapId: string;
    message: string;
    encryptedKey: any;
  }) {
    return await client.messaging.executeSendMessageTransaction({
      signer,
      channelId,
      memberCapId,
      message,
      encryptedKey,
    });
  }
  export async function fetchMessages(client: any, channelId: string, userAddress: string, limit = 20) {
    const messages = await client.messaging.getChannelMessages({
      channelId,
      userAddress,
      limit,
      direction: "backward",
    });
    return messages.messages;
  }
    