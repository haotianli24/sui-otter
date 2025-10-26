import { useState } from 'react';
import { Bot, MessageCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ChatInterface from '@/components/agents/ChatInterface';

export default function AgentsPage() {
  const [showChat, setShowChat] = useState(false);

  if (showChat) {
    return <ChatInterface onBack={() => setShowChat(false)} />;
  }

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Bot className="h-16 w-16 text-blue-500" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            AI Agents
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Powered by Fetch.ai's ASI:One, our AI agents help you navigate the Sui blockchain ecosystem with intelligent assistance.
          </p>
        </div>

        {/* Agent Cards */}
        <div className="grid gap-6">
          {/* Otter AI Chat */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-white dark:bg-gray-800 hover:shadow-lg transition-shadow">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                <MessageCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                  Otter AI Chat
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Chat with Otter AI to discover Sui communities, get blockchain insights, and find answers to your questions about trading, NFTs, and more.
                </p>
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
                  <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  <span>Powered by ASI:One</span>
                </div>
                <Button 
                  onClick={() => setShowChat(true)}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Start Chatting
                </Button>
              </div>
            </div>
          </div>

          {/* Copy Trading Agent */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-white dark:bg-gray-800">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Bot className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                  Copy Trading Agent
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Autonomous agent that monitors traders and automatically copies their transactions based on your settings.
                </p>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Status: Active • Monitoring blockchain 24/7
                </div>
              </div>
            </div>
          </div>

          {/* Future Agents Placeholder */}
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-12 text-center">
            <Bot className="h-12 w-12 mx-auto mb-4 text-gray-400 opacity-50" />
            <p className="text-sm text-gray-500 dark:text-gray-400">More AI agents coming soon...</p>
          </div>
        </div>
      </div>
    </div>
  );
}

