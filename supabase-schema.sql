-- Personalized OtterAI Twin Database Schema
-- Run this SQL in your Supabase SQL Editor

-- Table: user_profiles
-- Stores user personality, interests, and customization
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT UNIQUE NOT NULL,
  username TEXT NOT NULL,
  tone TEXT NOT NULL CHECK (tone IN ('casual', 'professional', 'friendly', 'degen')),
  interests JSONB DEFAULT '[]'::jsonb,
  personality_summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster wallet address lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_wallet 
  ON user_profiles(wallet_address);

-- Table: chat_memories
-- Stores all chat messages and learned insights
CREATE TABLE IF NOT EXISTS chat_memories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  message TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  learned_insights JSONB DEFAULT '{}'::jsonb,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster wallet address lookups and timestamp ordering
CREATE INDEX IF NOT EXISTS idx_chat_memories_wallet_time 
  ON chat_memories(wallet_address, timestamp DESC);

-- Table: wallet_activity
-- Stores on-chain activity data from Sui blockchain
CREATE TABLE IF NOT EXISTS wallet_activity (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT UNIQUE NOT NULL,
  nft_count INTEGER DEFAULT 0,
  transaction_count INTEGER DEFAULT 0,
  defi_protocols JSONB DEFAULT '[]'::jsonb,
  last_scanned TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster wallet address lookups
CREATE INDEX IF NOT EXISTS idx_wallet_activity_wallet 
  ON wallet_activity(wallet_address);

-- Enable Row Level Security (RLS) for all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_activity ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Allow users to access only their own data
-- (Note: Adjust these policies based on your authentication setup)

-- user_profiles policies
CREATE POLICY "Users can view their own profile"
  ON user_profiles FOR SELECT
  USING (true);  -- Allow public read for now, tighten in production

CREATE POLICY "Users can insert their own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (true);  -- Allow public insert for now, tighten in production

CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  USING (true);  -- Allow public update for now, tighten in production

-- chat_memories policies
CREATE POLICY "Users can view their own memories"
  ON chat_memories FOR SELECT
  USING (true);  -- Allow public read for now, tighten in production

CREATE POLICY "Users can insert their own memories"
  ON chat_memories FOR INSERT
  WITH CHECK (true);  -- Allow public insert for now, tighten in production

-- wallet_activity policies
CREATE POLICY "Users can view their own activity"
  ON wallet_activity FOR SELECT
  USING (true);  -- Allow public read for now, tighten in production

CREATE POLICY "Users can insert their own activity"
  ON wallet_activity FOR INSERT
  WITH CHECK (true);  -- Allow public insert for now, tighten in production

CREATE POLICY "Users can update their own activity"
  ON wallet_activity FOR UPDATE
  USING (true);  -- Allow public update for now, tighten in production

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for user_profiles
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'OtterAI Twin database schema created successfully!';
  RAISE NOTICE 'Tables: user_profiles, chat_memories, wallet_activity';
  RAISE NOTICE 'Remember to set your Supabase credentials in .env.local';
END $$;

