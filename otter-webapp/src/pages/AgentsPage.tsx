import { useState } from 'react';
import { Bot, MessageCircle, TrendingUp, ArrowRight, Sparkles, Users, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import ChatInterface from '@/components/agents/ChatInterface';

export default function AgentsPage() {
  const [showChat, setShowChat] = useState(false);

  if (showChat) {
    return <ChatInterface onBack={() => setShowChat(false)} />;
  }

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Bot className="h-16 w-16 text-blue-500" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            AI Agents Hub
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Autonomous AI agents powered by Fetch.ai that help you trade, discover, and navigate the Sui blockchain ecosystem.
          </p>
        </div>

        {/* Agent Cards Grid */}
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          {/* Otter AI Chat */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-6 bg-white dark:bg-gray-800 hover:shadow-xl transition-all hover:scale-[1.02]">
            <div className="flex flex-col h-full">
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900 dark:to-emerald-900 rounded-xl">
                  <MessageCircle className="h-7 w-7 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Otter AI Chat
                  </h2>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    <span className="text-xs font-medium text-green-600 dark:text-green-400">Live</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Powered by ASI:One</span>
                  </div>
                </div>
              </div>
              
              <p className="text-gray-600 dark:text-gray-300 mb-6 flex-1">
                Your intelligent assistant for the Sui blockchain. Ask questions about communities, trading strategies, NFTs, and get instant expert guidance.
              </p>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Sparkles className="h-4 w-4 text-yellow-500" />
                  <span>Natural language understanding</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Activity className="h-4 w-4 text-blue-500" />
                  <span>Real-time blockchain insights</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Users className="h-4 w-4 text-purple-500" />
                  <span>Community discovery</span>
                </div>
              </div>
              
              <Button 
                onClick={() => setShowChat(true)}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Start Chatting
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>

          {/* Copy Trading Agent */}
          <Link to="/copy-trading" className="block group">
            <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-6 bg-white dark:bg-gray-800 hover:shadow-xl transition-all hover:scale-[1.02] h-full">
              <div className="flex flex-col h-full">
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-3 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900 dark:to-indigo-900 rounded-xl">
                    <TrendingUp className="h-7 w-7 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      Copy Trading Agent
                    </h2>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="inline-block w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                      <span className="text-xs font-medium text-blue-600 dark:text-blue-400">Active</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">Monitoring 24/7</span>
                    </div>
                  </div>
                </div>
                
                <p className="text-gray-600 dark:text-gray-300 mb-6 flex-1">
                  Autonomous trading agent that monitors top traders and automatically replicates their transactions based on your custom settings and risk preferences.
                </p>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Activity className="h-4 w-4 text-blue-500" />
                    <span>Real-time transaction monitoring</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span>Automated trade execution</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Users className="h-4 w-4 text-purple-500" />
                    <span>Follow expert traders</span>
                  </div>
                </div>
                
                <Button 
                  className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-semibold group-hover:translate-x-1 transition-transform"
                  asChild
                >
                  <div>
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Open Copy Trading
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </div>
                </Button>
              </div>
            </div>
          </Link>
        </div>

        {/* Info Banner */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <Bot className="h-8 w-8 text-purple-600 dark:text-purple-400 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Powered by Fetch.ai
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Our AI agents use Fetch.ai's advanced ASI:One framework to provide intelligent, autonomous assistance. 
                They learn from the Sui ecosystem and adapt to help you make better decisions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

