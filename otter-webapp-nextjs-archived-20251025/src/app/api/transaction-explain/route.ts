import { NextRequest, NextResponse } from "next/server";
import { generateTransactionExplanation } from "@/lib/gemini-service";

export async function POST(request: NextRequest) {
    try {
        const { digest, txData, context } = await request.json();

        if (!digest || !txData) {
            return NextResponse.json(
                { error: "Transaction digest and data are required" },
                { status: 400 }
            );
        }

        // Generate AI explanation with context
        const explanation = await generateTransactionExplanation(txData, context);

        return NextResponse.json({
            explanation,
            digest,
            cached: false,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error("Error generating explanation:", error);
        return NextResponse.json(
            { error: "Failed to generate explanation" },
            { status: 500 }
        );
    }
}
