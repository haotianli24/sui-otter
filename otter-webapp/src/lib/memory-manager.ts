import { supabase, isSupabaseConfigured, ChatMemory } from './supabase';
import { extractInsights } from './prompt-builder';

export async function saveMessage(
  walletAddress: string,
  message: string,
  role: 'user' | 'assistant',
  insights: Record<string, any> = {}
): Promise<ChatMemory | null> {
  if (!isSupabaseConfigured || !supabase) {
    return null;
  }
  
  try {
    const { data, error } = await supabase
      .from('chat_memories')
      .insert({
        wallet_address: walletAddress,
        message,
        role,
        learned_insights: insights,
        timestamp: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (err) {
    console.error('Error saving message:', err);
    return null;
  }
}

export async function getRecentMemories(
  walletAddress: string,
  limit: number = 20
): Promise<ChatMemory[]> {
  if (!isSupabaseConfigured || !supabase) {
    return [];
  }
  
  try {
    const { data, error } = await supabase
      .from('chat_memories')
      .select('*')
      .eq('wallet_address', walletAddress)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return data || [];
  } catch (err) {
    console.error('Error fetching memories:', err);
    return [];
  }
}

export async function analyzeAndUpdateInsights(
  walletAddress: string
): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    return;
  }
  
  try {
    // Get recent messages
    const memories = await getRecentMemories(walletAddress, 10);
    
    if (memories.length === 0) return;

    // Convert to format for insight extraction
    const messages = memories.map(m => ({
      role: m.role,
      content: m.message,
    }));

    // Extract new insights
    const newInsights = extractInsights(messages);

    // Update the most recent user message with insights if any found
    if (Object.keys(newInsights).length > 0) {
      const latestUserMessage = memories.find(m => m.role === 'user');
      
      if (latestUserMessage) {
        await supabase
          .from('chat_memories')
          .update({
            learned_insights: {
              ...latestUserMessage.learned_insights,
              ...newInsights,
            },
          })
          .eq('id', latestUserMessage.id);
      }
    }

    // Update profile with new insights if significant
    if (Object.keys(newInsights).length >= 3) {
      await updatePersonalitySummary(walletAddress);
    }
  } catch (err) {
    console.error('Error analyzing insights:', err);
  }
}

export async function updatePersonalitySummary(
  walletAddress: string
): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    return;
  }
  
  try {
    // Get all memories with insights
    const { data: memories } = await supabase
      .from('chat_memories')
      .select('learned_insights')
      .eq('wallet_address', walletAddress)
      .not('learned_insights', 'is', null);

    if (!memories || memories.length === 0) return;

    // Collect all insights
    const allInsights: string[] = [];
    memories.forEach(memory => {
      if (memory.learned_insights) {
        Object.values(memory.learned_insights).forEach(insight => {
          if (typeof insight === 'string' && !allInsights.includes(insight)) {
            allInsights.push(insight);
          }
        });
      }
    });

    // Build summary from insights
    const likes = allInsights.filter(i => i.startsWith('like:')).map(i => i.replace('like:', '').trim());
    const dislikes = allInsights.filter(i => i.startsWith('dislike:')).map(i => i.replace('dislike:', '').trim());
    const interests = allInsights.filter(i => i.startsWith('Interested in')).map(i => i.replace('Interested in', '').trim());

    let summary = 'A Sui blockchain user';
    
    if (likes.length > 0) {
      summary += ` who enjoys ${likes.slice(0, 3).join(', ')}`;
    }
    
    if (interests.length > 0) {
      summary += `. Interested in ${interests.slice(0, 3).join(', ')}`;
    }
    
    if (dislikes.length > 0) {
      summary += `. Avoids ${dislikes.slice(0, 2).join(', ')}`;
    }

    // Update profile
    await supabase
      .from('user_profiles')
      .update({
        personality_summary: summary,
        updated_at: new Date().toISOString(),
      })
      .eq('wallet_address', walletAddress);

  } catch (err) {
    console.error('Error updating personality summary:', err);
  }
}

export async function getMessageCount(walletAddress: string): Promise<number> {
  if (!isSupabaseConfigured || !supabase) {
    return 0;
  }
  
  try {
    const { count, error } = await supabase
      .from('chat_memories')
      .select('*', { count: 'exact', head: true })
      .eq('wallet_address', walletAddress);

    if (error) throw error;

    return count || 0;
  } catch (err) {
    console.error('Error getting message count:', err);
    return 0;
  }
}

