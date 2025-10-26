# ASI:One Chat Integration

This directory contains the integration with Fetch.ai's ASI:One API for conversational AI assistance.

## Setup

1. **Get an API Key**
   - Visit https://asi1.ai to create an account and get your API key

2. **Configure Environment**
   ```bash
   cp .env.example .env.local
   ```
   
   Then edit `.env.local` and add your API key:
   ```
   FETCHAI_API_KEY=your_actual_api_key_here
   ```

3. **Run the Development Server**
   ```bash
   npm run dev
   ```

4. **Access the Chat**
   - Open http://localhost:3000
   - Click "Explore AI Agents" button
   - Start chatting with Otter AI!

## Features

- **Conversational AI**: Chat with Otter AI about Sui blockchain topics
- **Context-Aware**: Maintains conversation history for coherent responses
- **Real-Time**: Instant responses powered by ASI:One's asi1-mini model
- **User-Friendly**: Clean chat interface with loading states

## File Structure

```
src/
├── app/
│   ├── api/
│   │   └── asi-chat/
│   │       └── route.ts          # Backend API route
│   └── agents/
│       ├── page.tsx               # Agents landing page
│       └── chat/
│           └── page.tsx           # Chat interface
└── components/
    └── ui/
        ├── ChatMessage.tsx        # Message bubble component
        └── ChatInput.tsx          # Input field component
```

## API Reference

### POST /api/asi-chat

Request body:
```json
{
  "message": "Tell me about Sui blockchain",
  "history": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ]
}
```

Response:
```json
{
  "reply": "Sui is a layer 1 blockchain..."
}
```

## Customization

You can customize the AI's behavior by editing the system prompt in:
`src/app/api/asi-chat/route.ts`

```typescript
const SYSTEM_PROMPT = `You are Otter AI...`;
```

## Troubleshooting

**Error: "API key not configured"**
- Make sure you've created `.env.local` with your API key
- Restart the dev server after adding environment variables

**Error: "ASI:One API error: 401"**
- Your API key is invalid or expired
- Get a new key from https://asi1.ai

**Chat not loading**
- Check browser console for errors
- Verify your API key is correctly set in `.env.local`
- Make sure the dev server is running

## Documentation

- [ASI:One Documentation](https://docs.asi1.ai)
- [Fetch.ai Developer Portal](https://fetch.ai)

