// Simple fallback explanation generator
function generateFallbackExplanation(txData: any): string {
    const operations = txData.operations || [];
    const moveCalls = txData.moveCalls || [];
    
    if (operations.length === 0) {
        return "Transaction processed successfully with no visible operations.";
    }

    const operationTypes = operations.map((op: any) => op.type).join(", ");
    const gasUsed = txData.gasUsed || "0";
    
    let explanation = `This transaction involved ${operations.length} operation(s): ${operationTypes}. `;
    
    if (moveCalls.length > 0) {
        const callNames = moveCalls.map((call: any) => `${call.module}::${call.function}`).join(", ");
        explanation += `Move calls: ${callNames}. `;
    }
    
    explanation += `Gas used: ${gasUsed} SUI. Transaction completed successfully.`;
    
    return explanation;
}

export async function generateTransactionExplanation(txData: any, _context?: any): Promise<string> {
    try {
        // Check if we have API key
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (!apiKey) {
            console.log("No Gemini API key, using fallback");
            return generateFallbackExplanation(txData);
        }

        // For now, use fallback since we don't have the Gemini client set up
        // TODO: Implement actual Gemini API integration
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