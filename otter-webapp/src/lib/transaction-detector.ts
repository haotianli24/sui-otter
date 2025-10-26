// Transaction hash detection patterns
const SUI_DIGEST_PATTERN = /\b[A-HJ-NP-Za-km-z1-9]{43,44}\b/g;
const HEX_HASH_PATTERN = /0x[a-fA-F0-9]{64}/g;

export function detectTransactionHash(text: string): string | null {
    if (!text || typeof text !== 'string') {
        return null;
    }

    // First try to find Sui digests (base58)
    const suiMatches = text.match(SUI_DIGEST_PATTERN);
    if (suiMatches && suiMatches.length > 0) {
        return suiMatches[0];
    }

    // Then try hex hashes
    const hexMatches = text.match(HEX_HASH_PATTERN);
    if (hexMatches && hexMatches.length > 0) {
        return hexMatches[0];
    }

    return null;
}

export function detectAllTransactionHashes(text: string): string[] {
    if (!text || typeof text !== 'string') {
        return [];
    }

    const suiMatches = text.match(SUI_DIGEST_PATTERN) || [];
    const hexMatches = text.match(HEX_HASH_PATTERN) || [];

    return [...suiMatches, ...hexMatches];
}

export function isValidTransactionHash(hash: string): boolean {
    if (!hash) return false;

    // Check if it's a valid Sui digest (43-44 base58 chars)
    if (/^[A-HJ-NP-Za-km-z1-9]{43,44}$/.test(hash)) {
        return true;
    }

    // Check if it's a valid hex hash
    if (/^0x[a-fA-F0-9]{64}$/i.test(hash)) {
        return true;
    }

    return false;
}