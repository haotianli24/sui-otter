# Gemini AI Integration for Transaction Explanations

This document explains how the Gemini AI integration works in the Sui Otter application for generating human-readable transaction explanations.

## Architecture

The integration uses a **serverless function** approach for security and scalability:

```
Client (gemini-service.ts) 
    ↓ 
    POST /api/gemini
    ↓
Vercel Serverless Function (api/gemini.js)
    ↓
Google Gemini API
```

### Why Serverless?

1. **Security**: API keys are stored server-side and never exposed to clients
2. **Rate Limiting**: Server-side rate limiting protects against abuse
3. **Scalability**: Vercel automatically scales the function based on demand
4. **Cost Control**: Only runs when needed, reducing costs

## Files Modified/Created

### 1. `/api/gemini.js` (NEW)
The Vercel serverless function that handles Gemini API calls:
- Validates requests
- Implements rate limiting (10 requests/minute per user, 6 seconds between requests)
- Calls Google Gemini API with transaction data
- Returns AI-generated explanations
- Gracefully falls back on errors

### 2. `/src/lib/gemini-service.ts` (UPDATED)
Client-side service that:
- Calls the `/api/gemini` endpoint
- Handles errors and falls back to local explanations
- Maintains rate limiting on the client side
- Provides context-aware transaction explanations

### 3. `package.json` (UPDATED)
- Replaced `@google/genai` with `@google/generative-ai` (official Google package)

### 4. `vercel.json` (UPDATED)
- Added API route handling
- Configured CORS headers for API endpoints
- Ensured proper routing for serverless functions

## Environment Variables

### In Vercel Dashboard

Add the following environment variable to your Vercel project:

```
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

**Important**: 
- Set this for **Production**, **Preview**, and **Development** environments
- The API key should NOT be prefixed with `VITE_` (it's server-side only)
- Get your API key from: https://makersuite.google.com/app/apikey

### Local Development

For local testing, create a `.env` file in the project root:

```bash
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

## Features

### Rate Limiting
- **Client-side**: 6 seconds minimum between requests
- **Server-side**: Maximum 10 requests per minute per user
- Automatic cleanup of old rate limit records

### Context-Aware Explanations
The AI considers:
- Who sent the transaction (user vs. others)
- The group/chat context
- Protocol information (DeFi, validators, exchanges)
- Transaction participants and operations

### Graceful Fallbacks
If the Gemini API is unavailable or fails:
1. Returns a well-formatted fallback explanation
2. Logs the error for debugging
3. Never breaks the user experience

### Personalized Language
- Uses "you/your" for the current user's transactions
- Uses names/pronouns for other users' transactions
- Maintains conversation context

## API Endpoint

### POST `/api/gemini`

**Request Body:**
```json
{
  "txData": {
    "digest": "transaction_hash",
    "gasUsed": "0.001",
    "participants": ["address1", "address2"],
    "operations": [
      {
        "type": "transfer",
        "description": "Transfer tokens",
        "amount": "100",
        "asset": "SUI"
      }
    ],
    "moveCalls": [
      {
        "package": "0x2",
        "module": "coin",
        "function": "transfer"
      }
    ],
    "protocolName": "Sui Framework"
  },
  "context": {
    "senderName": "Alice",
    "isCurrentUser": false,
    "groupName": "DeFi Traders",
    "currentUserAddress": "0x..."
  },
  "userId": "user_address_or_anonymous"
}
```

**Response (Success):**
```json
{
  "explanation": "Alice transferred 100 SUI tokens using the Sui Framework...",
  "success": true
}
```

**Response (Fallback):**
```json
{
  "error": "Rate limit exceeded",
  "fallback": true
}
```

## Installation Steps

### 1. Install Dependencies
```bash
npm install
```

This will install the correct `@google/generative-ai` package.

### 2. Configure Vercel Environment Variables
In your Vercel dashboard:
1. Go to Project Settings → Environment Variables
2. Add `GEMINI_API_KEY` with your API key
3. Enable for Production, Preview, and Development

### 3. Deploy to Vercel
```bash
vercel --prod
```

Or push to your connected Git repository for automatic deployment.

### 4. Test Locally (Optional)
```bash
# Install Vercel CLI
npm i -g vercel

# Run local development server
vercel dev
```

This will simulate the Vercel environment locally.

## Usage in Code

```typescript
import { generateTransactionExplanation } from './lib/gemini-service';

// Generate explanation
const explanation = await generateTransactionExplanation(
  {
    digest: "...",
    gasUsed: "0.001",
    participants: ["0x..."],
    operations: [...],
    moveCalls: [...],
  },
  {
    senderName: "Alice",
    isCurrentUser: false,
    groupName: "My Group",
    currentUserAddress: "0x...",
  }
);

console.log(explanation);
// Output: "Alice transferred tokens on Sui Framework..."
```

## Monitoring & Debugging

### Check Logs in Vercel
1. Go to your Vercel project
2. Click on "Logs" tab
3. Filter by `/api/gemini` to see function logs

### Common Issues

**Issue**: "Gemini API unavailable"
- **Solution**: Check that `GEMINI_API_KEY` is set in Vercel environment variables

**Issue**: "Rate limited"
- **Solution**: Wait 6 seconds between requests, or increase rate limits in `api/gemini.js`

**Issue**: CORS errors
- **Solution**: The `vercel.json` configuration should handle this automatically

## Security Considerations

1. **API Key Protection**: Never commit API keys to Git
2. **Rate Limiting**: Protects against abuse and high costs
3. **CORS**: Configured to allow requests from your domain
4. **Fallback**: Always provides a response, even if API fails

## Cost Optimization

- Uses `gemini-1.5-flash` model (faster and cheaper than Pro)
- Rate limiting reduces unnecessary API calls
- Client-side caching of explanations (in parent components)
- Automatic fallback to free local explanations

## Future Improvements

- [ ] Add caching layer (Redis/Vercel KV) for repeated transactions
- [ ] Implement user-specific rate limits with authentication
- [ ] Add analytics for API usage and costs
- [ ] Support streaming responses for longer explanations
- [ ] Add A/B testing for different prompts

## Support

For issues or questions:
1. Check Vercel function logs
2. Review the console output in browser DevTools
3. Verify environment variables are set correctly
4. Test the `/api/gemini` endpoint directly with curl/Postman

---

**Last Updated**: October 28, 2025

