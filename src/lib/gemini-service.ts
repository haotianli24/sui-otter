interface TransactionData {
    digest: string;
    gasUsed: string;
    participants: string[];
    operations: Array<{
        type: string;
        description: string;
        from?: string;
        to?: string;
        amount?: string;
        asset?: string;
    }>;
    moveCalls: Array<{
        package: string;
        module: string;
        function: string;
        arguments: string[];
    }>;
    protocolName?: string;
    validatorName?: string;
    cexName?: string;
}

interface MessageContext {
    senderName: string;
    isCurrentUser: boolean;
    groupName?: string;
    currentUserAddress?: string;
}

// Simple rate limiting
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 6000; // 6 seconds between requests

function generateFallbackExplanation(txData: TransactionData, context?: MessageContext): string {
    const operations = txData.operations || [];
    const moveCalls = txData.moveCalls || [];

    if (operations.length === 0) {
        return "Transaction processed successfully with no visible operations.";
    }

    // Find the main operation type
    const transferOps = operations.filter(op => op.type === 'transfer');
    const createOps = operations.filter(op => op.type === 'create');
    const callOps = operations.filter(op => op.type === 'call');

    // Determine main action with appropriate pronouns
    let mainAction = "executed a transaction";
    let protocol = "Sui blockchain";
    let pronoun = "User";

    // Set appropriate pronoun based on context
    if (context) {
        // Check if any transaction participants match the current user's address
        const isUserTransaction = context.isCurrentUser ||
            (context.currentUserAddress && txData.participants.includes(context.currentUserAddress));

        if (isUserTransaction) {
            pronoun = "You";
        } else {
            pronoun = context.senderName || "User";
        }
    }

    // Determine if this is a user transaction
    const isUserTransaction = context && (context.isCurrentUser ||
        (context.currentUserAddress && txData.participants.includes(context.currentUserAddress)));

    if (transferOps.length > 0) {
        const hasAmount = transferOps.some(op => op.amount);
        if (hasAmount) {
            mainAction = isUserTransaction ? "transferred tokens" : "transferred tokens";
        } else {
            mainAction = isUserTransaction ? "transferred objects" : "transferred objects";
        }
    } else if (createOps.length > 0) {
        mainAction = isUserTransaction ? "created new objects" : "created new objects";
    } else if (callOps.length > 0) {
        mainAction = isUserTransaction ? "called smart contract functions" : "called smart contract functions";
    }

    // Try to identify protocol from move calls
    if (moveCalls.length > 0) {
        const firstCall = moveCalls[0];
        const packageId = firstCall.package;

        // Simple protocol detection
        if (packageId.includes("cetus") || packageId.includes("turbos")) {
            protocol = "DeFi protocol";
        } else if (packageId.includes("0x2")) {
            protocol = "Sui Framework";
        }
    }

    // Use protocol name from transaction data if available
    if (txData.protocolName) {
        protocol = txData.protocolName;
    }

    const gasAmount = parseFloat(txData.gasUsed);
    const gasText = gasAmount > 0.001 ? `${txData.gasUsed} SUI` : "minimal gas";

    return `${pronoun} ${mainAction} on ${protocol}, paying ${gasText} in transaction fees. Transaction completed successfully.`;
}

export async function generateTransactionExplanation(txData: TransactionData, _context?: MessageContext): Promise<string> {
    // Simple rate limiting
    const now = Date.now();
    if (now - lastRequestTime < MIN_REQUEST_INTERVAL) {
        throw new Error("Rate limited - please wait before requesting another explanation");
    }
    lastRequestTime = now;

    try {
        // Get current user's address for userId (for rate limiting)
        const userId = _context?.currentUserAddress || 'anonymous';

        // Call the Vercel serverless function
        const response = await fetch('/api/gemini', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                txData,
                context: _context,
                userId,
            }),
        });

        const data = await response.json();

        // If the API returns a fallback flag, use local fallback
        if (data.fallback || !data.success) {
            console.warn("Gemini API unavailable or failed, using fallback explanation:", data.error);
            return generateFallbackExplanation(txData, _context);
        }

        if (data.explanation) {
            return data.explanation;
        }

        throw new Error('No explanation received from API');
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        return generateFallbackExplanation(txData, _context);
    }
}

export async function isGeminiAvailable(): Promise<boolean> {
    try {
        // Check if the API endpoint is available by making a HEAD request
        const response = await fetch('/api/gemini', {
            method: 'OPTIONS',
        });
        
        return response.ok;
    } catch (error) {
        console.error("Gemini API not available:", error);
        return false;
    }
}