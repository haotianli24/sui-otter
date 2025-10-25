'use client';

import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Settings, Wallet, TrendingUp, DollarSign, Activity } from 'lucide-react';
import { useRouter } from 'next/navigation';
import HomeClient from '../components/HomeClient';
import { useState, useEffect } from 'react';

const Portfolio = () => {
  const router = useRouter();
  const account = useCurrentAccount();
  const suiClient = useSuiClient();
  const [balance, setBalance] = useState<string>('0');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchBalance = async () => {
      if (!account?.address) return;
      
      setIsLoading(true);
      try {
        const coins = await suiClient.getBalance({
          owner: account.address,
        });
        setBalance(coins.totalBalance);
      } catch (error) {
        console.error('Error fetching balance:', error);
        setBalance('0');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBalance();
  }, [account?.address, suiClient]);

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatBalance = (balance: string) => {
    const numBalance = parseFloat(balance) / 1e9; // Convert from MIST to SUI
    return numBalance.toFixed(4);
  };

  return (
    <div className="min-h-screen bg-background">
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
            <Button variant="ghost" onClick={() => router.push('/dashboard')}>Messages</Button>
            <Button variant="ghost" onClick={() => router.push('/explore')}>Explore</Button>
            <Button variant="default">Portfolio</Button>
            <Button variant="ghost" size="icon">
              <Settings className="h-5 w-5" />
            </Button>
            <HomeClient />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!account ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <Wallet className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-semibold text-foreground mb-2">Connect Your Wallet</h2>
            <p className="text-muted-foreground mb-6">
              Connect your Sui wallet to view your portfolio and trading history.
            </p>
            <HomeClient />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Portfolio Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Portfolio</h1>
                <p className="text-muted-foreground">Your trading overview and wallet details</p>
              </div>
              <Badge variant="outline" className="text-green-500 border-green-500">
                Connected
              </Badge>
            </div>

            {/* Wallet Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  Wallet Information
                </CardTitle>
                <CardDescription>
                  Your connected Sui wallet details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Address</span>
                  <span className="font-mono text-sm bg-muted px-2 py-1 rounded">
                    {formatAddress(account.address)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Network</span>
                  <Badge variant="secondary">Sui Testnet</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Balance</span>
                  <span className="font-semibold text-lg">
                    {isLoading ? 'Loading...' : `${formatBalance(balance)} SUI`}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Trading Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total P&L</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-500">+$2,847.32</div>
                  <p className="text-xs text-muted-foreground">
                    +12.5% from last month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Trades</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">7</div>
                  <p className="text-xs text-muted-foreground">
                    3 profitable, 4 pending
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-500">68.2%</div>
                  <p className="text-xs text-muted-foreground">
                    Last 30 days
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Trades */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Trades</CardTitle>
                <CardDescription>
                  Your latest trading activity
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">SUI/USDC Long</p>
                        <p className="text-sm text-muted-foreground">2 hours ago</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-500">+$234.50</p>
                      <p className="text-sm text-muted-foreground">+8.2%</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                        <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />
                      </div>
                      <div>
                        <p className="font-medium">BTC/USDC Short</p>
                        <p className="text-sm text-muted-foreground">5 hours ago</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-red-500">-$89.20</p>
                      <p className="text-sm text-muted-foreground">-3.1%</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">ETH/USDC Long</p>
                        <p className="text-sm text-muted-foreground">1 day ago</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-500">+$567.80</p>
                      <p className="text-sm text-muted-foreground">+15.3%</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Portfolio;

