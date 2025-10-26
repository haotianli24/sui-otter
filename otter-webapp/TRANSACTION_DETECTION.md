# Transaction Detection & Embed Feature

## Overview
This feature automatically detects transaction digests in messages and displays them as interactive embeds with AI-powered explanations.

## Features
- **Automatic Detection**: Detects Sui digests (base58) and hex hashes in message content
- **Transaction Embeds**: Shows transaction details, gas usage, operations, and AI explanations
- **Caching**: Caches transaction data and explanations for 24 hours
- **AI Explanations**: Uses Gemini AI for contextual transaction explanations

## Setup
1. Copy `.env.example` to `.env`
2. Add your Gemini API key: `VITE_GEMINI_API_KEY=your_key_here`
3. Restart the development server

## Usage
Simply send a message containing a transaction digest (e.g., `2k5J8...` or `0x1234...`) and it will automatically render as an embed below the message.

## Files Added
- `src/lib/transaction-detector.ts` - Detection logic
- `src/lib/transaction-cache.ts` - Caching utilities
- `src/lib/gemini-service.ts` - AI explanation service
- `src/components/transaction/TransactionEmbed.tsx` - Embed component
