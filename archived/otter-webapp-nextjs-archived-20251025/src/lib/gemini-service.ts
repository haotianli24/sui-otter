import { GoogleGenAI } from "@google/genai";
import { resolveProtocolName, resolveAddressLabel, resolveValidatorName, resolveCexName } from "./protocol-registry";

// Initialize Gemini AI
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
const model = genAI.models;

// Simple rate limiting
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 6000; // 6 seconds between requests

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

export async function generateTransactionExplanation(txData: TransactionData, context?: MessageContext): Promise<string> {
    try {
        // Check if we have API key
        if (!process.env.GEMINI_API_KEY) {
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

        // Build context-aware prompt with protocol information
        let contextInfo = "";
        if (context) {
            if (context.isCurrentUser) {
                contextInfo = `This is YOUR transaction that you shared in ${context.groupName || 'the chat'}. `;
            } else {
                contextInfo = `${context.senderName} shared this transaction in ${context.groupName || 'the chat'}. `;
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

        // Enhance operation descriptions with resolved names
        const enhancedOperations = txData.operations.map(op => {
            let enhancedDesc = op.description;

            // Replace addresses with resolved names where possible
            if (op.from) {
                const fromLabel = resolveAddressLabel(op.from);
                if (fromLabel) {
                    enhancedDesc = enhancedDesc.replace(op.from.slice(0, 6) + '...' + op.from.slice(-4), fromLabel);
                }
            }
            if (op.to) {
                const toLabel = resolveAddressLabel(op.to);
                if (toLabel) {
                    enhancedDesc = enhancedDesc.replace(op.to.slice(0, 6) + '...' + op.to.slice(-4), toLabel);
                }
            }

            return enhancedDesc;
        });

        const prompt = `Explain this Sui blockchain transaction in 1-2 sentences.

${contextInfo}Transaction Details:
- Gas: ${txData.gasUsed} SUI
- Operations: ${txData.operations.length} operations
- Participants: ${txData.participants.length} addresses
- Smart Contracts: ${txData.moveCalls.length} function calls
${protocolContext}

Operations Summary:
${enhancedOperations.map((op, i) => `${i + 1}. ${op}`).join('\n')}

Smart Contract Calls:
${txData.moveCalls.map((call, i) => `${i + 1}. ${call.module}::${call.function}`).join('\n')}

Explain only what actually happened based on the data above. Be factual, concise, and avoid assumptions. No emojis.`;

        const result = await model.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt
        });
        const explanation = result.text;

        return explanation?.trim() || generateFallbackExplanation(txData);
    } catch (error) {
        console.error("Error generating explanation with Gemini:", error);

        // Check if it's a rate limit error
        if (error instanceof Error && error.message.includes('429')) {
            console.log("Rate limit hit, using fallback explanation");
        }

        // Fallback to rule-based explanation
        return generateFallbackExplanation(txData);
    }
}

function generateFallbackExplanation(txData: TransactionData): string {
    const operations = txData.operations;
    const moveCalls = txData.moveCalls;

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

    // Try to identify protocol from move calls using registry
    if (moveCalls.length > 0) {
        const firstCall = moveCalls[0];
        const packageId = firstCall.package;
        const resolvedProtocol = resolveProtocolName(packageId);

        if (resolvedProtocol !== "Unknown Protocol") {
            protocol = resolvedProtocol;
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

export async function isGeminiAvailable(): Promise<boolean> {
    try {
        if (!process.env.GEMINI_API_KEY) {
            return false;
        }

        // Test with a simple prompt
        const result = await model.generateContent({
            model: "gemini-2.5-flash",
            contents: "Test"
        });
        return true;
    } catch (error) {
        console.error("Gemini API not available:", error);
        return false;
    }
}
