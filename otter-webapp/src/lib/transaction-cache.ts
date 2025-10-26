import { LRUCache } from "lru-cache";

interface CachedTransaction {
    explanation: string;
    txData: any;
    timestamp: string;
    digest: string;
}

// In-memory LRU cache (max 50 entries)
const memoryCache = new LRUCache<string, CachedTransaction>({
    max: 50,
    ttl: 24 * 60 * 60 * 1000, // 24 hours
});

const CACHE_PREFIX = "otter_tx_";
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

export function getCachedTransaction(digest: string): CachedTransaction | null {
    // Check memory cache first
    const memoryResult = memoryCache.get(digest);
    if (memoryResult) {
        return memoryResult;
    }

    // Check localStorage
    if (typeof window !== "undefined") {
        try {
            const cached = localStorage.getItem(`${CACHE_PREFIX}${digest}`);
            if (cached) {
                const parsed = JSON.parse(cached);
                const now = Date.now();

                // Check if cache is still valid
                if (now - parsed.timestamp < CACHE_TTL) {
                    // Store in memory cache for faster access
                    memoryCache.set(digest, parsed);
                    return parsed;
                } else {
                    // Remove expired cache
                    localStorage.removeItem(`${CACHE_PREFIX}${digest}`);
                }
            }
        } catch (error) {
            console.error("Error reading from localStorage:", error);
        }
    }

    return null;
}

export function setCachedTransaction(digest: string, data: CachedTransaction): void {
    const now = Date.now().toString();
    const cachedData = {
        ...data,
        timestamp: now,
    };

    // Store in memory cache
    memoryCache.set(digest, cachedData);

    // Store in localStorage (if available)
    if (typeof window !== "undefined") {
        try {
            localStorage.setItem(`${CACHE_PREFIX}${digest}`, JSON.stringify(cachedData));
        } catch (error) {
            console.error("Error writing to localStorage:", error);
        }
    }
}

export function clearExpiredCache(): void {
    if (typeof window !== "undefined") {
        try {
            const keys = Object.keys(localStorage);
            const now = Date.now();

            keys.forEach(key => {
                if (key.startsWith(CACHE_PREFIX)) {
                    try {
                        const cached = JSON.parse(localStorage.getItem(key)!);
                        if (now - cached.timestamp >= CACHE_TTL) {
                            localStorage.removeItem(key);
                        }
                    } catch (error) {
                        // Remove invalid cache entries
                        localStorage.removeItem(key);
                    }
                }
            });
        } catch (error) {
            console.error("Error clearing expired cache:", error);
        }
    }
}

export function clearAllCache(): void {
    // Clear memory cache
    memoryCache.clear();

    // Clear localStorage
    if (typeof window !== "undefined") {
        try {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith(CACHE_PREFIX)) {
                    localStorage.removeItem(key);
                }
            });
        } catch (error) {
            console.error("Error clearing localStorage cache:", error);
        }
    }
}
