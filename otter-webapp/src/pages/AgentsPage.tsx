import { useState } from 'react';
import { Bot, MessageCircle, TrendingUp, Sparkles, Users, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import ChatInterface from '@/components/agents/ChatInterface';

export default function AgentsPage() {
  const [showChat, setShowChat] = useState(false);

  if (showChat) {
    return <ChatInterface onBack={() => setShowChat(false)} />;
  }

  return (
    <div className="page-container">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="page-heading flex items-center gap-3">
            <Bot className="h-10 w-10 text-primary" />
            AI Agents
          </h1>
          <p className="page-subtitle">
            Autonomous AI agents powered by Fetch.ai that help you trade, discover, and navigate the Sui blockchain ecosystem.
          </p>
        </div>

        {/* Agent Cards Grid */}
        <div className="grid gap-6 md:grid-cols-2 mb-6">
          {/* Otter AI Chat */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setShowChat(true)}>
            <CardContent className="p-6">
              <div className="flex flex-col h-full">
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-3 bg-green-500/10 rounded-xl">
                    <MessageCircle className="h-7 w-7 text-green-500" />
                  </div>
                  <div className="flex-1">
                    <h2 className="section-heading mb-2">
                      Otter AI Chat
                    </h2>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                      <span className="text-xs font-medium text-green-500">Live</span>
                      <span className="muted-text">• Powered by ASI:One</span>
                    </div>
                  </div>
                </div>
                
                <p className="body-text mb-6 flex-1">
                  Your intelligent assistant for the Sui blockchain. Ask questions about communities, trading strategies, NFTs, and get instant expert guidance.
                </p>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-2 muted-text">
                    <Sparkles className="h-4 w-4 text-yellow-500" />
                    <span>Natural language understanding</span>
                  </div>
                  <div className="flex items-center gap-2 muted-text">
                    <Activity className="h-4 w-4 text-blue-500" />
                    <span>Real-time blockchain insights</span>
                  </div>
                  <div className="flex items-center gap-2 muted-text">
                    <Users className="h-4 w-4 text-purple-500" />
                    <span>Community discovery</span>
                  </div>
                </div>
                
                <Button 
                  className="w-full bg-green-500 hover:bg-green-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowChat(true);
                  }}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Start Chatting
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Copy Trading Agent */}
          <Link to="/copy-trading" className="block">
            <Card className="hover:shadow-lg transition-shadow h-full">
              <CardContent className="p-6">
                <div className="flex flex-col h-full">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="p-3 bg-blue-500/10 rounded-xl">
                      <TrendingUp className="h-7 w-7 text-blue-500" />
                    </div>
                    <div className="flex-1">
                      <h2 className="section-heading mb-2">
                        Copy Trading Agent
                      </h2>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="inline-block w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                        <span className="text-xs font-medium text-blue-500">Active</span>
                        <span className="muted-text">• Monitoring 24/7</span>
                      </div>
                    </div>
                  </div>
                  
                  <p className="body-text mb-6 flex-1">
                    Autonomous trading agent that monitors top traders and automatically replicates their transactions based on your custom settings and risk preferences.
                  </p>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2 muted-text">
                      <Activity className="h-4 w-4 text-blue-500" />
                      <span>Real-time transaction monitoring</span>
                    </div>
                    <div className="flex items-center gap-2 muted-text">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <span>Automated trade execution</span>
                    </div>
                    <div className="flex items-center gap-2 muted-text">
                      <Users className="h-4 w-4 text-purple-500" />
                      <span>Follow expert traders</span>
                    </div>
                  </div>
                  
                  <Button className="w-full bg-blue-500 hover:bg-blue-600">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Open Copy Trading
                  </Button>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Info Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-purple-500/10 rounded-xl">
                <Bot className="h-8 w-8 text-purple-500" />
              </div>
              <div>
                <h3 className="card-heading mb-2">
                  Powered by Fetch.ai
                </h3>
                <p className="muted-text">
                  Our AI agents use Fetch.ai's advanced ASI:One framework to provide intelligent, autonomous assistance. 
                  They learn from the Sui ecosystem and adapt to help you make better decisions.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

