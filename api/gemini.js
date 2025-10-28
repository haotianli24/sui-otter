// Vercel Serverless Function for Gemini API
import { GoogleGenerativeAI } from '@google/generative-ai';

// Rate limiting configuration
const requestTimestamps = new Map();
const MIN_REQUEST_INTERVAL = 6000; // 6 seconds between requests per user
const MAX_REQUESTS_PER_MINUTE = 10;
const CLEANUP_INTERVAL = 60000; // Clean up old timestamps every minute

// Cleanup old timestamps periodically
setInterval(() => {
    const now = Date.now();
    for (const [key, timestamps] of requestTimestamps.entries()) {
        const recentTimestamps = timestamps.filter(t => now - t < CLEANUP_INTERVAL);
        if (recentTimestamps.length === 0) {
            requestTimestamps.delete(key);
        } else {
            requestTimestamps.set(key, recentTimestamps);
        }
    }
}, CLEANUP_INTERVAL);

function checkRateLimit(userId) {
    const now = Date.now();
    const userTimestamps = requestTimestamps.get(userId) || [];
    
    // Filter timestamps from the last minute
    const recentTimestamps = userTimestamps.filter(t => now - t < 60000);
    
    // Check if too many requests in the last minute
    if (recentTimestamps.length >= MAX_REQUESTS_PER_MINUTE) {
        throw new Error('Rate limit exceeded - please wait before requesting more explanations');
    }
    
    // Check minimum interval
    if (recentTimestamps.length > 0) {
        const lastRequest = recentTimestamps[recentTimestamps.length - 1];
        if (now - lastRequest < MIN_REQUEST_INTERVAL) {
            throw new Error('Rate limited - please wait before requesting another explanation');
        }
    }
    
    // Add current timestamp
    recentTimestamps.push(now);
    requestTimestamps.set(userId, recentTimestamps);
}

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
        
        if (!apiKey) {
            return res.status(503).json({ 
                error: 'Gemini API key not configured',
                fallback: true 
            });
        }

        const { txData, context, userId = 'anonymous' } = req.body;

        if (!txData) {
            return res.status(400).json({ error: 'Transaction data is required' });
        }

        // Rate limiting
        try {
            checkRateLimit(userId);
        } catch (error) {
            return res.status(429).json({ 
                error: error.message,
                fallback: true 
            });
        }

        // Initialize Gemini AI
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        // Build personalized context for pronoun usage
        let pronounContext = "";
        let contextInfo = "";
        
        if (context) {
            // Check if any transaction participants match the current user's address
            const isUserTransaction = context.isCurrentUser ||
                (context.currentUserAddress && txData.participants.includes(context.currentUserAddress));

            if (isUserTransaction) {
                pronounContext = `IMPORTANT: This is the current user's transaction. When referring to the wallet/account that performed this transaction, use "you" and "your". For example: "You transferred tokens" or "Your wallet created a new object".`;
            } else {
                pronounContext = `IMPORTANT: This is ${context.senderName}'s transaction. When referring to the wallet/account that performed this transaction, use "${context.senderName}" or "they/their". For example: "${context.senderName} transferred tokens" or "Their wallet created a new object".`;
            }

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
        
        return res.status(200).json({ 
            explanation,
            success: true 
        });

    } catch (error) {
        console.error('Gemini API error:', error);
        
        // Return error with fallback flag
        return res.status(500).json({ 
            error: error.message || 'Failed to generate explanation',
            fallback: true 
        });
    }
}

