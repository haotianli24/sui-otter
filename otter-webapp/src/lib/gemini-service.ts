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
}

// Simple rate limiting
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 6000; // 6 seconds between requests

function generateFallbackExplanation(txData: TransactionData): string {
    const operations = txData.operations || [];
    const moveCalls = txData.moveCalls || [];

    if (operations.length === 0) {
        return "Transaction processed successfully with no visible operations.";
    }

    // Find the main operation type
    const transferOps = operations.filter(op => op.type === 'transfer');
    const createOps = operations.filter(op => op.type === 'create');
    const callOps = operations.filter(op => op.type === 'call');

    // Determine main action
    let mainAction = "executed a transaction";
    let protocol = "Sui blockchain";

    if (transferOps.length > 0) {
        const hasAmount = transferOps.some(op => op.amount);
        if (hasAmount) {
            mainAction = "transferred tokens";
        } else {
            mainAction = "transferred objects";
        }
    } else if (createOps.length > 0) {
        mainAction = "created new objects";
    } else if (callOps.length > 0) {
        mainAction = "called smart contract functions";
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

    return `User ${mainAction} on ${protocol}, paying ${gasText} in transaction fees. Transaction completed successfully.`;
}

export async function generateTransactionExplanation(txData: TransactionData, _context?: MessageContext): Promise<string> {
    try {
        // Check if we have API key
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (!apiKey) {
            console.log("No Gemini API key, using fallback");
            return generateFallbackExplanation(txData);
        }

        // Simple rate limiting
        const now = Date.now();
        if (now - lastRequestTime < MIN_REQUEST_INTERVAL) {
            console.log("Rate limiting: using fallback explanation");
            return generateFallbackExplanation(txData);
        }
        lastRequestTime = now;

        // Build context-aware prompt
        // let contextInfo = "";
        // if (context) {
        //     if (context.isCurrentUser) {
        //         contextInfo = `This is YOUR transaction that you shared in ${context.groupName || 'the chat'}. `;
        //     } else {
        //         contextInfo = `${context.senderName} shared this transaction in ${context.groupName || 'the chat'}. `;
        //     }
        // }

        // Build protocol and address context
        let protocolContext = "";
        if (txData.protocolName) {
            protocolContext += `- Protocol: ${txData.protocolName}\n`;
        }
        if (txData.validatorName) {
            protocolContext += `- Validator: ${txData.validatorName}\n`;
        }
        if (txData.cexName) {
            protocolContext += `- Exchange: ${txData.cexName}\n`;
        }

        // For now, use a simple fetch to a hypothetical API endpoint
        // In a real implementation, you would call the Gemini API here
        console.log("Gemini API integration not yet implemented, using fallback");
        return generateFallbackExplanation(txData);
    } catch (error) {
        console.error("Error generating explanation:", error);
        return generateFallbackExplanation(txData);
    }
}

export async function isGeminiAvailable(): Promise<boolean> {
    try {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        return !!apiKey;
    } catch (error) {
        console.error("Gemini API not available:", error);
        return false;
    }
}