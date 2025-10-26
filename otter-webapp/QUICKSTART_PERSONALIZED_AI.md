# 🚀 Quick Start: Personalized OtterAI Twin

## ⚡ 3-Minute Setup

### Step 1: Create Supabase Project (2 minutes)

1. Go to **https://supabase.com** and sign up/login
2. Click **"New Project"**
3. Fill in:
   - Name: `otter-ai` (or any name)
   - Database Password: (create a strong password)
   - Region: Choose closest to you
4. Click **"Create new project"**
5. Wait ~1 minute for project to initialize

### Step 2: Run Database Migration (30 seconds)

1. In Supabase dashboard, go to **SQL Editor** (left sidebar)
2. Click **"New Query"**
3. Copy entire contents of `supabase-schema.sql`
4. Paste into the editor
5. Click **"Run"** button
6. You should see: "Success. No rows returned"

### Step 3: Get API Credentials (30 seconds)

1. In Supabase, go to **Settings** > **API** (left sidebar)
2. Copy these two values:
   - **Project URL** (under "Project URL")
   - **anon public** key (under "Project API keys")

### Step 4: Configure Environment (30 seconds)

Create `otter-webapp/.env.local` with:

```bash
# Fetch.ai (already configured)
FETCHAI_API_KEY=sk_1ca6bd86b301469c87e42c79875dc6ecfa7684f8aaf54dd093bab30c619051a7

# Supabase (paste your values here)
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ey...
```

### Step 5: Test It! (now)

```bash
cd otter-webapp
npm run dev
```

1. Open http://localhost:5173
2. Click **"Agents"** in sidebar
3. Click **"Start Chatting"**
4. Connect your Sui wallet
5. **ProfileSetupModal should appear!**
6. Fill out your profile or click "Scan My Wallet"
7. Start chatting with your personalized AI twin! 🎉

---

## ✅ What Should Happen

### First Time

1. **Modal appears** asking for name, tone, interests
2. **Click "Scan My Wallet"** → automatically detects your NFTs, DeFi activity
3. **Submit** → profile saved
4. **Welcome message**: "Hello [YourName]! I'm [YourName]AI..."
5. **Profile badge** appears showing your AI twin info
6. **Chat works** with personalized responses

### After 5 Messages

- AI starts learning your preferences
- Check Supabase → see `chat_memories` table filling up
- Personality summary updates automatically

### Next Visit

- Profile loads automatically
- Chat history preserved
- AI remembers your interests

---

## 🔍 Verify Setup

### Check Supabase Tables

Go to **Table Editor** in Supabase:

**user_profiles** - Should have:
- ✅ Your wallet address
- ✅ Username, tone, interests
- ✅ Personality summary

**chat_memories** - Should have:
- ✅ Each message you sent
- ✅ Each AI response
- ✅ Timestamps

**wallet_activity** - Should have:
- ✅ Your NFT count
- ✅ Transaction count
- ✅ DeFi protocols (if any)

---

## ❓ Troubleshooting

### "Supabase credentials not found"
- ❌ `.env.local` doesn't exist or has typos
- ✅ Create file in `otter-webapp/.env.local`
- ✅ Use `VITE_` prefix (important!)
- ✅ Restart dev server: `Ctrl+C` then `npm run dev`

### Profile modal doesn't appear
- ❌ Wallet not connected
- ✅ Click "Connect Wallet" first
- ✅ Check browser console for errors

### Messages not saving
- ❌ Supabase tables not created
- ✅ Re-run `supabase-schema.sql` in SQL Editor
- ✅ Check Table Editor - tables should exist

### "Error loading agents"
- ❌ TypeScript compilation issue
- ✅ Run: `npm install` (ensure all deps installed)
- ✅ Check console for specific error
- ✅ Try clearing cache: `rm -rf node_modules/.vite`

---

## 🎯 Test Checklist

- [ ] Supabase project created
- [ ] SQL migration ran successfully
- [ ] `.env.local` file created with correct values
- [ ] Dev server running without errors
- [ ] Wallet connected
- [ ] ProfileSetupModal appears
- [ ] Profile submission works
- [ ] Chat works with personalized greeting
- [ ] ProfileBadge displays correctly
- [ ] Messages save to Supabase (check Table Editor)
- [ ] After 5 messages, check `learned_insights` in DB

---

## 📖 Full Documentation

- **Detailed Setup**: `PERSONALIZED_AI_SETUP.md`
- **Implementation Details**: `PERSONALIZED_AI_IMPLEMENTATION.md`
- **Database Schema**: `supabase-schema.sql`

---

## 🎉 You're Done!

Your personalized AI twin is now live! It will:
- Speak in your chosen tone
- Focus on your interests
- Learn from your conversations
- Reference your on-chain activity
- Get better over time

**Enjoy your AI twin!** 🚀✨

---

*Need help? Check the browser console for errors or review the full documentation files.*

