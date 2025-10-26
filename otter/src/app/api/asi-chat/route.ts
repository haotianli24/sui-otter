import { NextRequest, NextResponse } from 'next/server';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface RequestBody {
  message: string;
  history?: Message[];
}

const SYSTEM_PROMPT = `You are Otter AI, a smart assistant for the Sui blockchain. Help users discover trending, beginner-friendly, or topic-specific Sui communities based on natural language queries. You can provide information about Sui blockchain features, trading, NFTs, and community engagement. Be helpful, concise, and friendly.`;

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json();
    const { message, history = [] } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required and must be a string' },
        { status: 400 }
      );
    }

    const apiKey = process.env.FETCHAI_API_KEY;
    if (!apiKey) {
      console.error('FETCHAI_API_KEY is not configured');
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    // Build messages array with system prompt, history, and current message
    const messages: Message[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history,
      { role: 'user', content: message }
    ];

    // Call ASI:One API
    const response = await fetch('https://api.asi1.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'asi1-mini',
        messages: messages
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ASI:One API error:', response.status, errorText);
      return NextResponse.json(
        { error: `ASI:One API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Extract reply from ASI:One response
    const reply = data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';

    return NextResponse.json({ reply });

  } catch (error) {
    console.error('Error in asi-chat route:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

