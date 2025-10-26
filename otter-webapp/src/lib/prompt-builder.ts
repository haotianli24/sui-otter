import { UserProfile, WalletActivity, ChatMemory } from './supabase';

export function buildPersonalizedPrompt(
  profile: UserProfile,
  walletActivity: WalletActivity | null,
  recentMemories: ChatMemory[]
): string {
  const username = profile.username || 'User';
  const tone = profile.tone || 'casual';
  const interests = profile.interests || [];
  const personalitySummary = profile.personality_summary || 'a Sui blockchain enthusiast';

  // Build the base prompt
  let prompt = `You are ${username}AI, a personalized digital twin for ${username} on the Sui blockchain.

PERSONALITY:
- Tone: ${tone} (speak in a ${tone} manner)
- Interests: ${interests.length > 0 ? interests.join(', ') : 'Sui blockchain, DeFi, NFTs'}
- About: ${personalitySummary}`;

  // Add wallet activity context
  if (walletActivity) {
    prompt += `\n\nON-CHAIN ACTIVITY:`;
    
    if (walletActivity.nft_count > 0) {
      prompt += `\n- Owns ${walletActivity.nft_count} NFTs`;
    }
    
    if (walletActivity.transaction_count > 0) {
      const level = walletActivity.transaction_count > 50 ? 'very active' : 
                    walletActivity.transaction_count > 10 ? 'active' : 'new';
      prompt += `\n- ${level} on Sui (${walletActivity.transaction_count} transactions)`;
    }
    
    if (walletActivity.defi_protocols.length > 0) {
      prompt += `\n- Uses DeFi: ${walletActivity.defi_protocols.join(', ')}`;
    }
  }

  // Add learned preferences from recent conversations
  if (recentMemories.length > 0) {
    const insights: string[] = [];
    
    recentMemories.forEach(memory => {
      if (memory.learned_insights && Object.keys(memory.learned_insights).length > 0) {
        Object.entries(memory.learned_insights).forEach(([key, value]) => {
          if (value && typeof value === 'string') {
            insights.push(value);
          }
        });
      }
    });

    if (insights.length > 0) {
      prompt += `\n\nLEARNED PREFERENCES:\n`;
      insights.slice(0, 5).forEach(insight => {
        prompt += `- ${insight}\n`;
      });
    }
  }

  // Add behavior guidelines
  prompt += `\n\nGUIDELINES:
- Speak like ${username} would based on their ${tone} tone
- Prioritize topics related to ${interests.slice(0, 3).join(', ')}
- Be helpful and knowledgeable about Sui blockchain
- Keep responses SHORT (2-3 sentences max)
- Reference their on-chain activity when relevant
- Adapt your responses based on their interests and learned preferences`;

  return prompt;
}

export function extractInsights(messages: { role: string; content: string }[]): Record<string, any> {
  const insights: Record<string, any> = {};
  
  // Look for preference keywords
  const preferencePatterns = [
    { pattern: /I (like|love|enjoy|prefer|am interested in) (.+?)(\.|$|,)/gi, type: 'like' },
    { pattern: /I (hate|dislike|avoid|don't like) (.+?)(\.|$|,)/gi, type: 'dislike' },
    { pattern: /my favorite (.+?) is (.+?)(\.|$|,)/gi, type: 'favorite' },
  ];

  messages.forEach((msg, index) => {
    if (msg.role === 'user') {
      preferencePatterns.forEach(({ pattern, type }) => {
        const matches = msg.content.matchAll(pattern);
        for (const match of matches) {
          const subject = match[2].trim().slice(0, 50); // Limit length
          insights[`${type}_${index}`] = `${type}: ${subject}`;
        }
      });

      // Extract mentioned topics (simple word extraction)
      const topics = ['DeFi', 'NFT', 'trading', 'staking', 'gaming', 'AI', 'agent'];
      topics.forEach(topic => {
        if (msg.content.toLowerCase().includes(topic.toLowerCase())) {
          insights[`topic_${topic}_${index}`] = `Interested in ${topic}`;
        }
      });
    }
  });

  return insights;
}

