import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Copy, Mail, Globe } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { gradientFromAddress } from "@/utils/gradient";

export default function ProfilePage() {
  const { address } = useAuth();
  const [copied, setCopied] = useState(false);
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");

  const storageKey = useMemo(() => (address ? `profile:${address.toLowerCase()}` : null), [address]);

  useEffect(() => {
    if (!storageKey) return;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        setUsername(parsed.username ?? "");
        setBio(parsed.bio ?? "");
      } else {
        setUsername("");
        setBio("");
      }
    } catch {}
  }, [storageKey]);

  const saveProfile = () => {
    if (!storageKey) return;
    const payload = { username, bio };
    try {
      localStorage.setItem(storageKey, JSON.stringify(payload));
    } catch {}
  };

  if (!address) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-4">Profile</h1>
        <p className="text-muted-foreground">Please sign in with Google (zkLogin) to view and edit your profile.</p>
      </div>
    );
  }

  const copyAddress = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const initials = address.slice(2, 4).toUpperCase();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">My Profile</h1>
      </div>

      {/* Profile Header Card */}
      <Card className="border border-border bg-card">
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src="" alt={address} />
              <AvatarFallback className="text-primary-foreground text-2xl" style={{ background: gradientFromAddress(address) }}>
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold">Wallet Account</h2>
              <p className="text-muted-foreground">Connected to Sui Network</p>
            </div>
          </div>

          {/* Address Section */}
          <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">Wallet Address</p>
            <div className="flex items-center justify-between gap-2">
              <code className="text-sm font-mono break-all">{address}</code>
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
              <p className="text-sm text-muted-foreground">Messages Sent</p>
              <p className="text-2xl font-bold">0</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg space-y-2">
              <p className="text-sm text-muted-foreground">Channels Joined</p>
              <p className="text-2xl font-bold">0</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg space-y-2">
              <p className="text-sm text-muted-foreground">Member Since</p>
              <p className="text-sm font-medium">Today</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Details */}
      <Card className="border border-border bg-card">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Username</label>
            <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Choose a username" />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Bio</label>
            <textarea
              className="w-full min-h-[96px] p-3 bg-muted/50 rounded-lg outline-none border border-input focus:ring-2 focus:ring-ring"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell others about you"
            />
          </div>
          <div>
            <Button onClick={saveProfile}>Save</Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="border border-border bg-card">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button variant="outline" className="w-full justify-start" onClick={saveProfile}>Save Profile</Button>
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
