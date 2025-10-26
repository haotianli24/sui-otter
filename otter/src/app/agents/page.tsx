import Link from 'next/link';
import { Bot, MessageCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export const metadata = {
  title: 'AI Agents - Otter',
  description: 'Intelligent AI agents powered by Fetch.ai',
};

export default function AgentsPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Bot className="h-12 w-12 text-blue-500" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            AI Agents
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Powered by Fetch.ai's ASI:One, our AI agents help you navigate the Sui blockchain ecosystem with intelligent assistance.
          </p>
        </div>

        {/* Agent Cards */}
        <div className="grid gap-6 md:grid-cols-1">
          {/* Otter AI Chat */}
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <MessageCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                  Otter AI Chat
                </h2>
                <p className="text-gray-600 mb-4">
                  Chat with Otter AI to discover Sui communities, get blockchain insights, and find answers to your questions about trading, NFTs, and more.
                </p>
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                  <Sparkles className="h-4 w-4" />
                  <span>Powered by ASI:One</span>
                </div>
                <Link href="/agents/chat">
                  <Button className="bg-blue-500 hover:bg-blue-600 text-white">
                    Start Chatting
                  </Button>
                </Link>
              </div>
            </div>
          </Card>

          {/* Future agents can be added here */}
          <Card className="p-6 border-dashed">
            <div className="text-center text-gray-400 py-8">
              <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">More AI agents coming soon...</p>
            </div>
          </Card>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-8">
          <Link href="/" className="text-blue-500 hover:text-blue-600 text-sm">
            ← Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}

