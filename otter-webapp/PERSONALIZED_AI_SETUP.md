# Personalized OtterAI Twin Setup Guide

## Overview

The Personalized OtterAI Twin transforms the standard chat AI into a personalized digital twin that:
- Speaks in the user's preferred tone (casual, professional, friendly, degen)
- Knows the user's interests (DeFi, NFTs, Trading, etc.)
- Learns from the user's on-chain activity
- Adapts over time based on chat history

## Setup Instructions

### 1. Create Supabase Project

1. Go to [Supabase](https://supabase.com) and create a new project
2. Wait for the project to be fully initialized
3. Go to **Settings > API** and copy:
   - `Project URL` (your Supabase URL)
   - `anon public` key (your public API key)

### 2. Run Database Migration

1. In your Supabase dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy the contents of `supabase-schema.sql` into the editor
4. Click **Run** to create all tables and indexes

This will create:
- `user_profiles` - User personality and preferences
- `chat_memories` - Chat history with learned insights
- `wallet_activity` - On-chain activity data

### 3. Configure Environment Variables

Create or update `/Users/anson/sui-otter/.env.local`:

```bash
# Fetch.ai API Key (already configured)
FETCHAI_API_KEY=sk_1ca6bd86b301469c87e42c79875dc6ecfa7684f8aaf54dd093bab30c619051a7

# Supabase Configuration (add these)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

⚠️ **Important**: Use `VITE_` prefix for environment variables in Vite projects!

### 4. Install Dependencies (Already Done)

The Supabase client has been installed:
```bash
npm install @supabase/supabase-js
```

### 5. Test the Integration

1. Start the development server:
   ```bash
   cd /Users/anson/sui-otter/otter-webapp
   npm run dev
   ```

2. Navigate to the **Agents** page
3. Click **Start Chatting**
4. Connect your Sui wallet
5. You should see the Profile Setup Modal

## Features

### Level 1: Personality + Wallet-based Prompting

✅ **Profile Creation**
- User fills out a form with name, tone, interests
- Optional wallet scanning for automatic profile generation
- Personality summary generated from on-chain activity

✅ **Personalized Prompts**
- System prompt includes user's tone, interests, personality
- References on-chain activity (NFTs owned, DeFi protocols used)
- Adapts responses to match user's style

### Level 2: Behavioral Learning

✅ **Short-term Memory**
- All chat messages saved to Supabase
- Recent conversation history included in prompts
- Context preserved across sessions

✅ **Insight Extraction**
- Detects user preferences ("I like X", "I hate Y")
- Identifies repeated topics of interest
- Updates personality summary every 5 messages

✅ **Profile Evolution**
- Personality summary automatically improves over time
- User can view and edit their profile
- "Learning" badge shows AI is adapting

## Architecture

### Frontend Components

```
src/components/agents/
├── ChatInterface.tsx       # Main chat UI with profile integration
├── ProfileSetupModal.tsx   # Onboarding form for new users
├── ProfileBadge.tsx        # Shows user profile & learning status
├── ChatMessage.tsx         # Message bubble component
└── ChatInput.tsx           # Input field component
```

### Backend Services

```
src/lib/
├── supabase.ts            # Supabase client & type definitions
├── wallet-scanner.ts      # Scans Sui wallet for on-chain data
├── prompt-builder.ts      # Builds personalized AI prompts
└── memory-manager.ts      # Saves messages & extracts insights
```

### Custom Hooks

```
src/hooks/
└── useUserProfile.ts      # CRUD operations for user profiles
```

## How It Works

### 1. Profile Creation Flow

```
User clicks "Start Chatting"
  ↓
Check if user has profile
  ↓
If NO → Show ProfileSetupModal
  ↓
User fills form OR scans wallet
  ↓
Profile saved to Supabase (user_profiles table)
  ↓
Chat interface loads
```

### 2. Message Flow

```
User sends message
  ↓
Save to Supabase (chat_memories table)
  ↓
Load recent memories (last 20 messages)
  ↓
Build personalized prompt with:
  - User's tone & interests
  - On-chain activity
  - Learned preferences
  ↓
Call ASI:One API with personalized prompt
  ↓
Save AI response to Supabase
  ↓
Every 5 messages → Analyze & extract insights
```

### 3. Learning Process

```
Extract keywords from user messages:
  - "I like X" → Add to preferences
  - "I hate Y" → Add to dislikes
  - Repeated topics → Add to interests
  ↓
Update chat_memories with learned_insights
  ↓
Every few insights → Regenerate personality_summary
  ↓
Updated summary used in future prompts
```

## Customization

### Add New Tones

Edit `ProfileSetupModal.tsx`:
```typescript
const TONE_OPTIONS = [
  { value: 'casual', label: 'Casual', description: '...' },
  { value: 'aggressive', label: 'Aggressive', description: 'Bold and assertive' },
  // Add more...
];
```

### Add New Interests

Edit `ProfileSetupModal.tsx`:
```typescript
const INTEREST_OPTIONS = [
  'DeFi', 'NFTs', 'AI Agents', 'Trading',
  'Your New Interest', // Add here
];
```

### Customize Learning Frequency

Edit `ChatInterface.tsx`:
```typescript
// Analyze every 5 messages (default)
if (userMessageCount > 0 && (userMessageCount + 1) % 5 === 0) {
  analyzeAndUpdateInsights(account.address);
}

// Change to 3 messages:
if (userMessageCount > 0 && (userMessageCount + 1) % 3 === 0) {
  // ...
}
```

## Troubleshooting

### "Supabase credentials not found"
- Check that `.env.local` has `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Restart the dev server after adding env variables

### Profile Setup Modal doesn't appear
- Make sure your wallet is connected
- Check browser console for errors
- Verify Supabase tables were created correctly

### Messages not saving
- Check Supabase dashboard > Table Editor > `chat_memories`
- Verify RLS policies are set correctly
- Check network tab for failed requests

### Wallet scanning takes too long
- Normal on first scan (queries blockchain)
- Consider caching results in `wallet_activity` table
- Reduce transaction limit in `scanTransactions()`

## Next Steps

### Phase 5 Features (Optional)

1. **Profile Viewer/Editor Page**
   - Create `/agents/profile` route
   - Allow users to view all learned insights
   - Edit personality manually

2. **Memory Search**
   - Add search bar to filter past conversations
   - Full-text search on `chat_memories`

3. **Multiple Personalities**
   - Allow users to create different AI twins
   - "Work Twin" vs "Casual Twin"
   - Switch between them

4. **Advanced Learning**
   - Use embeddings for semantic memory search
   - Fine-tune prompts based on user feedback
   - Add sentiment analysis

## Security Notes

⚠️ **Current RLS Policies are permissive** - Anyone can read/write any data.

For production, update the RLS policies in Supabase to use proper authentication:

```sql
-- Example: Restrict to authenticated users only
CREATE POLICY "Users can view their own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid()::text = wallet_address);
```

⚠️ **API Key is in frontend code** - For production, move the Fetch.ai API key to a backend API route.

## Resources

- [Supabase Docs](https://supabase.com/docs)
- [Fetch.ai ASI:One API](https://docs.asi1.ai)
- [Sui RPC API](https://docs.sui.io/references/sui-api)

## Support

If you encounter issues:
1. Check the browser console for errors
2. Verify Supabase tables exist and are accessible
3. Test Supabase connection with a simple query
4. Check that environment variables are loaded

---

Built with ❤️ using Fetch.ai ASI:One and Supabase

