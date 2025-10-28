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
    // Check if we have API key
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY;
    if (!apiKey) {
        return generateFallbackExplanation(txData, _context);
    }

    // Simple rate limiting
    const now = Date.now();
    if (now - lastRequestTime < MIN_REQUEST_INTERVAL) {
        throw new Error("Rate limited - please wait before requesting another explanation");
    }
    lastRequestTime = now;

    // Build context-aware prompt
    let contextInfo = "";
    if (_context) {
        if (_context.isCurrentUser) {
            contextInfo = `This is YOUR transaction that you shared in ${_context.groupName || 'the chat'}. `;
        } else {
            contextInfo = `${_context.senderName} shared this transaction in ${_context.groupName || 'the chat'}. `;
        }
    }

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

    // Call the actual Gemini API
    const { GoogleGenerativeAI } = await import("@google/genai");
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Build personalized context for pronoun usage
    let pronounContext = "";
    if (_context) {
        // Check if any transaction participants match the current user's address
        const isUserTransaction = _context.isCurrentUser ||
            (_context.currentUserAddress && txData.participants.includes(_context.currentUserAddress));

        if (isUserTransaction) {
            pronounContext = `IMPORTANT: This is the current user's transaction. When referring to the wallet/account that performed this transaction, use "you" and "your". For example: "You transferred tokens" or "Your wallet created a new object".`;
        } else {
            pronounContext = `IMPORTANT: This is ${_context.senderName}'s transaction. When referring to the wallet/account that performed this transaction, use "${_context.senderName}" or "they/their". For example: "${_context.senderName} transferred tokens" or "Their wallet created a new object".`;
        }
    }

    const prompt = `Given a Sui blockchain transaction digest, explain in simple, friendly language what this transaction entails. Include the following details:

    The type of transaction (e.g., transfer, minting, object mutation)

    The main objects involved and their roles

    The outcome or effect of the transaction

    Any relevant context needed for understanding

    Use clear, non-technical language suitable for a general audience

    Keep the explanation brief, no more than a few sentences

Make it easy to understand for someone with no blockchain background.

${pronounContext}

${contextInfo}Transaction Details:
- Hash: ${txData.digest}
- Gas Used: ${txData.gasUsed} SUI
- Participants: ${txData.participants.length} addresses

Operations:
${txData.operations.map(op => `- ${op.type}: ${op.description}${op.amount ? ` (${op.amount} ${op.asset || 'tokens'})` : ''}`).join('\n')}

Move Calls:
${txData.moveCalls.map(call => `- ${call.package}::${call.module}::${call.function}`).join('\n')}

${protocolContext ? `Additional Context:\n${protocolContext}` : ''}`;

    console.log("Calling Gemini API for transaction explanation...");
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const explanation = response.text();

    console.log("Gemini API response received");
    return explanation;
}

export async function isGeminiAvailable(): Promise<boolean> {
    try {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY;
        if (!apiKey) {
            return false;
        }

        // Test with a simple API call
        const { GoogleGenerativeAI } = await import("@google/genai");
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        // Simple test prompt
        const result = await model.generateContent("Test");
        await result.response;

        return true;
    } catch (error) {
        console.error("Gemini API not available:", error);
        return false;
    }
}