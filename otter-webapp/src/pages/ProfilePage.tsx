import { useCurrentAccount } from "@mysten/dapp-kit";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Copy, Mail, Globe } from "lucide-react";
import { useState } from "react";

export default function ProfilePage() {
  const currentAccount = useCurrentAccount();
  const [copied, setCopied] = useState(false);

  if (!currentAccount) {
    return (
      <div className="page-container">
        <h1 className="page-heading mb-2">Profile</h1>
        <p className="page-subtitle">Please connect your wallet to view your profile.</p>
      </div>
    );
  }

  const copyAddress = () => {
    navigator.clipboard.writeText(currentAccount.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getInitials = (address: string) => {
    return address.slice(0, 2).toUpperCase();
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-heading">My Profile</h1>
      </div>

      {/* Profile Header Card */}
      <Card className="border border-border bg-card">
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src="" alt={currentAccount.address} />
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                {getInitials(currentAccount.address)}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <h2 className="section-heading">Wallet Account</h2>
              <p className="page-subtitle">Connected to Sui Network</p>
            </div>
          </div>

          {/* Address Section */}
          <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
            <p className="muted-text">Wallet Address</p>
            <div className="flex items-center justify-between gap-2">
              <code className="body-text font-mono break-all">{currentAccount.address}</code>
              <Button
                variant="outline"
                size="sm"
                onClick={copyAddress}
              >
                <Copy className="h-4 w-4 mr-2" />
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-muted/50 rounded-lg space-y-2">
              <p className="muted-text">Messages Sent</p>
              <p className="text-2xl font-bold">0</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg space-y-2">
              <p className="muted-text">Channels Joined</p>
              <p className="text-2xl font-bold">0</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg space-y-2">
              <p className="muted-text">Member Since</p>
              <p className="body-text font-medium">Today</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card className="border border-border bg-card">
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <Mail className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="muted-text">Email</p>
              <p className="body-text">Not set</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <Globe className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="muted-text">Website</p>
              <p className="body-text">Not set</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="border border-border bg-card">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button variant="outline" className="w-full justify-start">
            Edit Profile
          </Button>
          <Button variant="outline" className="w-full justify-start">
            View Transaction History
          </Button>
          <Button variant="outline" className="w-full justify-start">
            Download Data
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
