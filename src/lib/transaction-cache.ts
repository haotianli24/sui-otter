interface CachedTransaction {
    digest: string;
    txData: any;
    explanation: string;
    timestamp: string;
}

const CACHE_KEY = 'transaction_cache';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

export function getCachedTransaction(digest: string): CachedTransaction | null {
    try {
        const cached = localStorage.getItem(`${CACHE_KEY}_${digest}`);
        if (!cached) return null;

        const parsed: CachedTransaction = JSON.parse(cached);
        const now = Date.now();
        const cacheTime = parseInt(parsed.timestamp);

        if (now - cacheTime > CACHE_EXPIRY) {
            localStorage.removeItem(`${CACHE_KEY}_${digest}`);
            return null;
        }

        return parsed;
    } catch (error) {
        console.error('Error reading from cache:', error);
        return null;
    }
}

export function setCachedTransaction(digest: string, data: CachedTransaction): void {
    try {
        localStorage.setItem(`${CACHE_KEY}_${digest}`, JSON.stringify(data));
    } catch (error) {
        console.error('Error writing to cache:', error);
    }
}

export function clearTransactionCache(): void {
    try {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith(CACHE_KEY)) {
                localStorage.removeItem(key);
            }
        });
        console.log('Transaction cache cleared');
    } catch (error) {
        console.error('Error clearing cache:', error);
    }
}

// Clear cache on page load to force fresh data
if (typeof window !== 'undefined') {
    clearTransactionCache();
}