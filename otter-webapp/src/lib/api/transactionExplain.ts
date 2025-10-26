import { generateTransactionExplanation } from "../gemini-service";

export interface TransactionExplainRequest {
    digest: string;
    txData: any;
    context?: {
        senderName: string;
        isCurrentUser: boolean;
        groupName?: string;
    };
}

export interface TransactionExplainResponse {
    explanation: string;
    digest: string;
    cached: boolean;
    timestamp: string;
}

export async function explainTransaction(
    digest: string,
    txData: any,
    context?: TransactionExplainRequest['context']
): Promise<TransactionExplainResponse | null> {
    try {
        if (!digest || !txData) {
            throw new Error("Transaction digest and data are required");
        }

        // Generate AI explanation with context
        const explanation = await generateTransactionExplanation(txData, context);

        return {
            explanation,
            digest,
            cached: false,
            timestamp: new Date().toISOString(),
        };
    } catch (error) {
        console.error("Error generating explanation:", error);
        return null;
    }
}
