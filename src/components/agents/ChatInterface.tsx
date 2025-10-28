import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Loader2, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ZeroBackground } from '@/components/ui/zero-background';
import { useCurrentAccount } from '@mysten/dapp-kit';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import ProfileSetupModal, { ProfileData } from './ProfileSetupModal';
import ProfileBadge from './ProfileBadge';
import { useUserProfile } from '@/hooks/useUserProfile';
import { buildPersonalizedPrompt } from '@/lib/prompt-builder';
import { saveMessage, getRecentMemories, analyzeAndUpdateInsights, getMessageCount } from '@/lib/memory-manager';
import { isSupabaseConfigured } from '@/lib/supabase';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatInterfaceProps {
  onBack: () => void;
}

// API key - In production, this should be in a backend API
const FETCHAI_API_KEY = 'sk_1ca6bd86b301469c87e42c79875dc6ecfa7684f8aaf54dd093bab30c619051a7';

export default function ChatInterface({ onBack }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const [userMessageCount, setUserMessageCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const account = useCurrentAccount();
  const { profile, walletActivity, loading, hasProfile, createProfile } = useUserProfile(account?.address);

  // Check for profile and show setup modal if needed (only if Supabase is configured)
  useEffect(() => {
    if (isSupabaseConfigured && !loading && account?.address && !hasProfile) {
      setShowProfileSetup(true);
    }
  }, [loading, hasProfile, account]);

  // Load initial message count
  useEffect(() => {
    const loadMessageCount = async () => {
      if (account?.address) {
        const count = await getMessageCount(account.address);
        setMessageCount(count);
      }
    };
    loadMessageCount();
  }, [account?.address]);

  // Show welcome message when profile is loaded OR default message if no Supabase
  useEffect(() => {
    if (messages.length === 0) {
      if (profile) {
        const welcomeMessage = `Hello ${profile.username}! I'm ${profile.username}AI, your personalized twin. I know you're interested in ${profile.interests.slice(0, 2).join(' and ')}. How can I help you today?`;
        setMessages([{
          role: 'assistant',
          content: welcomeMessage
        }]);
      } else if (!loading) {
        // Default welcome message when no profile
        setMessages([{
          role: 'assistant',
          content: 'Hello! I\'m Otter AI, your Sui blockchain assistant. How can I help you today?'
        }]);
      }
    }
  }, [profile, loading]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle profile setup completion
  const handleProfileComplete = async (profileData: ProfileData) => {
    setShowProfileSetup(false);
    await createProfile(profileData);
  };

  // Handle profile setup skip
  const handleProfileSkip = async () => {
    setShowProfileSetup(false);
    // Create a default profile
    await createProfile({
      username: 'User',
      tone: 'casual',
      interests: ['Sui blockchain'],
      personality_summary: 'A Sui blockchain enthusiast',
    });
  };

  const handleSendMessage = async (message: string) => {
    // Add user message to chat
    const userMessage: Message = { role: 'user', content: message };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    // Save user message to database if Supabase is configured
    if (account?.address) {
      await saveMessage(account.address, message, 'user');
      setUserMessageCount(prev => prev + 1);
    }

    try {
      // Build system prompt (personalized if profile exists, default otherwise)
      let systemPrompt: string;
      
      if (profile && account?.address) {
        // Get recent memories for context
        const recentMemories = await getRecentMemories(account.address, 20);
        systemPrompt = buildPersonalizedPrompt(profile, walletActivity, recentMemories);
      } else {
        // Default system prompt
        systemPrompt = 'You are Otter AI, a smart assistant for the Sui blockchain. Help users discover Sui communities and blockchain information. Keep responses SHORT (2-3 sentences max) and to the point. Only provide longer explanations if specifically asked. Be helpful and friendly.';
      }

      // Prepare message history
      const history = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      // Call ASI:One API
      const response = await fetch('https://api.asi1.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${FETCHAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'asi1-mini',
          max_tokens: 200,
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            ...history,
            { role: 'user', content: message }
          ]
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const reply = data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';

      // Add AI response to chat
      const aiMessage: Message = {
        role: 'assistant',
        content: reply
      };
      setMessages(prev => [...prev, aiMessage]);

      // Save AI message to database if Supabase is configured
      if (account?.address) {
        await saveMessage(account.address, reply, 'assistant');
        setMessageCount(prev => prev + 2); // User + AI message

        // Analyze and update insights every 5 user messages
        if (userMessageCount > 0 && (userMessageCount + 1) % 5 === 0) {
          analyzeAndUpdateInsights(account.address);
        }
      }

    } catch (error) {
      console.error('Error sending message:', error);
      // Add error message
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while checking for profile
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-green-500" />
      </div>
    );
  }

  return (
    <>
      {/* Profile Setup Modal */}
      {showProfileSetup && (
        <ProfileSetupModal
          onComplete={handleProfileComplete}
          onSkip={handleProfileSkip}
        />
      )}

      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="border-b border-border flex-shrink-0 p-6 bg-card">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1">
              <h2 className="section-heading flex items-center gap-2">
                <Bot className="h-5 w-5 text-green-500" />
                {profile ? `${profile.username}AI` : 'Otter AI Chat'}
              </h2>
              <p className="muted-text">
                Powered by Fetch.ai ASI:One
              </p>
            </div>
            <div className="flex gap-6 text-sm">
              <div>
                <p className="small-text">Messages</p>
                <p className="card-heading">{messageCount}</p>
              </div>
              <div>
                <p className="small-text">Status</p>
                <p className="card-heading flex items-center gap-1">
                  <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  Live
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Badge */}
        {profile && (
          <div className="p-4 bg-background border-b border-border">
            <ProfileBadge
              profile={profile}
              walletActivity={walletActivity}
              messageCount={messageCount}
              onEdit={() => setShowProfileSetup(true)}
            />
          </div>
        )}

        {/* Messages Area */}
        <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0 bg-background relative">
          <ZeroBackground />
          <div
            className="relative z-10"
            onMouseMove={(e) => {
              // Forward mouse move events to the ZeroBackground
              const zeroBackground = e.currentTarget.parentElement?.querySelector('[data-zero-background]');
              if (zeroBackground) {
                zeroBackground.dispatchEvent(new MouseEvent('mousemove', {
                  clientX: e.clientX,
                  clientY: e.clientY,
                  bubbles: true
                }));
              }
            }}
            onMouseLeave={(e) => {
              // Forward mouse leave events to the ZeroBackground
              const zeroBackground = e.currentTarget.parentElement?.querySelector('[data-zero-background]');
              if (zeroBackground) {
                zeroBackground.dispatchEvent(new MouseEvent('mouseleave', {
                  clientX: e.clientX,
                  clientY: e.clientY,
                  bubbles: true
                }));
              }
            }}
          >
            {messages.length === 0 ? (
              <div className="empty-state">
                <div className="text-center">
                  <Bot className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <p className="section-heading mb-2">Start a conversation</p>
                  <p className="muted-text">
                    {profile 
                      ? `Ask ${profile.username}AI anything about Sui blockchain`
                      : 'Ask me anything about Sui blockchain'
                    }
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg, index) => (
                  <ChatMessage
                    key={index}
                    role={msg.role}
                    content={msg.content}
                  />
                ))}
                
                {/* Loading indicator */}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-green-500 text-white rounded-2xl px-4 py-3">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="border-t border-border flex-shrink-0 bg-card">
          <ChatInput onSend={handleSendMessage} disabled={isLoading} />
        </div>
      </div>
    </>
  );
}

