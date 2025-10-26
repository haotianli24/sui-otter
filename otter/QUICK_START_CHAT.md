# 🚀 Quick Start: Otter AI Chat

## Get Started in 3 Steps

### Step 1: Get Your API Key
1. Go to https://asi1.ai
2. Sign up or log in
3. Copy your API key

### Step 2: Configure Environment
```bash
cd otter
```

Edit `.env.local` and replace the placeholder:
```
FETCHAI_API_KEY=paste_your_actual_api_key_here
```

### Step 3: Run and Test
```bash
npm run dev
```

Open http://localhost:3000 and:
1. Click **"Explore AI Agents"**
2. Click **"Start Chatting"**  
3. Type: "What is Sui blockchain?"
4. Watch Otter AI respond! 🎉

## What You'll See

```
Homepage
   ↓ Click "Explore AI Agents"
Agents Page (with Otter AI Chat card)
   ↓ Click "Start Chatting"
Chat Interface
   ↓ Type your message
   ↓ Press Enter or click Send
AI Response appears!
```

## Test Questions

Try these to see Otter AI in action:
- "What is Sui blockchain?"
- "How do I start with NFTs on Sui?"
- "Tell me about Sui communities"
- "What are the benefits of Sui?"

## Troubleshooting

**"API key not configured"**
→ Make sure you saved `.env.local` and restarted the dev server

**"401 Unauthorized"**
→ Your API key is invalid. Get a new one from https://asi1.ai

**Chat not loading**
→ Check browser console (F12) for errors

## File Locations

- API Route: `src/app/api/asi-chat/route.ts`
- Chat Page: `src/app/agents/chat/page.tsx`
- Components: `src/components/ui/ChatMessage.tsx` and `ChatInput.tsx`

## Need Help?

See `README_ASI_CHAT.md` for full documentation or `ASI_CHAT_IMPLEMENTATION.md` for technical details.

---
✨ **Happy Chatting with Otter AI!** ✨

