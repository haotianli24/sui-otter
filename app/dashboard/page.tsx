'use client';

import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '../components/ui/resizable';
import { Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';
import HomeClient from '../components/HomeClient';

const Dashboard = () => {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navigation Bar */}
      <nav className="border-b border-border bg-card">
        <div className="flex items-center justify-between px-6 py-4">
          <div 
            className="font-playfair text-2xl font-semibold text-foreground cursor-pointer hover:text-primary transition-colors"
            onClick={() => router.push('/')}
          >
            Otter
          </div>
          <div className="flex items-center gap-4">
            <Button variant="default">Messages</Button>
            <Button variant="ghost" onClick={() => router.push('/explore')}>Explore</Button>
            <Button variant="ghost" onClick={() => router.push('/portfolio')}>Portfolio</Button>
            <Button variant="ghost" size="icon">
              <Settings className="h-5 w-5" />
            </Button>
            <HomeClient />
          </div>
        </div>
      </nav>

      {/* Main Content with Resizable Panels */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* Left Panel - DMs/Communities */}
          <ResizablePanel defaultSize={25} minSize={20} maxSize={40}>
            <div className="h-full border-r border-border bg-card overflow-hidden">
              <Tabs defaultValue="dms" className="h-full flex flex-col">
                <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent p-0">
                  <TabsTrigger 
                    value="dms" 
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
                  >
                    DM's
                  </TabsTrigger>
                  <TabsTrigger 
                    value="communities"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
                  >
                    Communities
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="dms" className="flex-1 p-4 m-0">
                  <div className="space-y-2">
                    <div className="p-3 rounded-lg hover:bg-accent cursor-pointer">
                      <p className="font-medium text-foreground">User 1</p>
                      <p className="text-sm text-muted-foreground">Last message preview...</p>
                    </div>
                    <div className="p-3 rounded-lg hover:bg-accent cursor-pointer">
                      <p className="font-medium text-foreground">User 2</p>
                      <p className="text-sm text-muted-foreground">Last message preview...</p>
                    </div>
                    <div className="p-3 rounded-lg hover:bg-accent cursor-pointer">
                      <p className="font-medium text-foreground">User 3</p>
                      <p className="text-sm text-muted-foreground">Last message preview...</p>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="communities" className="flex-1 p-4 m-0">
                  <div className="space-y-2">
                    <div className="p-3 rounded-lg hover:bg-accent cursor-pointer">
                      <p className="font-medium text-foreground">Trading Alpha</p>
                      <p className="text-sm text-muted-foreground">1.2K members</p>
                    </div>
                    <div className="p-3 rounded-lg hover:bg-accent cursor-pointer">
                      <p className="font-medium text-foreground">Sui Network</p>
                      <p className="text-sm text-muted-foreground">850 members</p>
                    </div>
                    <div className="p-3 rounded-lg hover:bg-accent cursor-pointer">
                      <p className="font-medium text-foreground">DeFi Traders</p>
                      <p className="text-sm text-muted-foreground">2.3K members</p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Right Panel - Chat Area */}
          <ResizablePanel defaultSize={75}>
            <div className="h-full bg-background flex flex-col">
              {/* Chat Header */}
              <div className="border-b border-border p-4 bg-card">
                <h2 className="font-semibold text-foreground">Select a conversation</h2>
              </div>
              
              {/* Chat Messages Area */}
              <div className="flex-1 p-6 overflow-y-auto">
                <div className="h-full flex items-center justify-center">
                  <p className="text-muted-foreground">
                    Choose a DM or Community to start chatting
                  </p>
                </div>
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
};

export default Dashboard;
