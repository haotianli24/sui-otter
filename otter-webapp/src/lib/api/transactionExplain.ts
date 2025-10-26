export interface TransactionExplainRequest {
    digest: string;
    txData: any;
    context?: {
        senderName: string;
        isCurrentUser: boolean;
        groupName?: string;
        currentUserAddress?: string;
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
    context?: TransactionExplainRequest['context']
): Promise<TransactionExplainResponse | null> {
    try {
        if (!digest) {
            throw new Error("Transaction digest is required");
        }

        // Call the API endpoint that fetches real transaction data
        const response = await fetch("/api/transaction-explain", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                digest,
                context
            }),
        });

        if (!response.ok) {
            throw new Error("Failed to generate explanation");
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error generating explanation:", error);
        return null;
    }
}
