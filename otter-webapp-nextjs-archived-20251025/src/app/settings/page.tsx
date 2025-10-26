"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import {
  Settings as SettingsIcon,
  Bell,
  Shield,
  HelpCircle,
  Moon,
  Sun,
} from "lucide-react";
import { currentUser } from "@/lib/mock-data";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [transactionExplainer, setTransactionExplainer] = useState(true);
  const [notifications, setNotifications] = useState({
    newMessages: true,
    tradePosts: true,
    communityUpdates: true,
    priceAlerts: false,
  });

  const handleSaveSettings = () => {
    alert("Settings saved! (This will connect to backend)");
  };

  return (
    <div className="h-full overflow-auto bg-background">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account preferences and app settings
          </p>
        </div>

        {/* Account Section */}
        <div className="bg-card border border-border p-6">
          <div className="flex items-center gap-2 mb-6">
            <SettingsIcon className="h-5 w-5" />
            <h2 className="text-xl font-semibold">Account</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Name</label>
              <input
                type="text"
                defaultValue={currentUser.name}
                className="w-full h-10 px-4 bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Bio</label>
              <textarea
                defaultValue={currentUser.bio}
                rows={3}
                className="w-full px-4 py-3 bg-background border border-input text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Wallet Address
              </label>
              <input
                type="text"
                value={currentUser.address}
                disabled
                className="w-full h-10 px-4 bg-muted border border-input text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Your wallet address cannot be changed
              </p>
            </div>
          </div>
        </div>

        {/* Appearance Section */}
        <div className="bg-card border border-border p-6">
          <div className="flex items-center gap-2 mb-6">
            {theme === "dark" ? (
              <Moon className="h-5 w-5" />
            ) : (
              <Sun className="h-5 w-5" />
            )}
            <h2 className="text-xl font-semibold">Appearance</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Theme</p>
                <p className="text-sm text-muted-foreground">
                  Choose between light and dark mode
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={theme === "light" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTheme("light")}
                >
                  Light
                </Button>
                <Button
                  variant={theme === "dark" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTheme("dark")}
                >
                  Dark
                </Button>
                <Button
                  variant={theme === "system" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTheme("system")}
                >
                  System
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="bg-card border border-border p-6">
          <div className="flex items-center gap-2 mb-6">
            <HelpCircle className="h-5 w-5" />
            <h2 className="text-xl font-semibold">Features</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium">Transaction Explainer</p>
                <p className="text-sm text-muted-foreground">
                  Get plain English explanations for every transaction
                </p>
              </div>
              <Switch
                checked={transactionExplainer}
                onCheckedChange={setTransactionExplainer}
              />
            </div>
          </div>
        </div>

        {/* Notifications Section */}
        <div className="bg-card border border-border p-6">
          <div className="flex items-center gap-2 mb-6">
            <Bell className="h-5 w-5" />
            <h2 className="text-xl font-semibold">Notifications</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium">New Messages</p>
                <p className="text-sm text-muted-foreground">
                  Get notified when you receive new messages
                </p>
              </div>
              <Switch
                checked={notifications.newMessages}
                onCheckedChange={(checked) =>
                  setNotifications((prev) => ({
                    ...prev,
                    newMessages: checked,
                  }))
                }
              />
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium">Trade Posts</p>
                <p className="text-sm text-muted-foreground">
                  Get notified when someone shares a trade
                </p>
              </div>
              <Switch
                checked={notifications.tradePosts}
                onCheckedChange={(checked) =>
                  setNotifications((prev) => ({ ...prev, tradePosts: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium">Community Updates</p>
                <p className="text-sm text-muted-foreground">
                  Get notified about updates in your communities
                </p>
              </div>
              <Switch
                checked={notifications.communityUpdates}
                onCheckedChange={(checked) =>
                  setNotifications((prev) => ({
                    ...prev,
                    communityUpdates: checked,
                  }))
                }
              />
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium">Price Alerts</p>
                <p className="text-sm text-muted-foreground">
                  Get notified when prices hit your targets
                </p>
              </div>
              <Switch
                checked={notifications.priceAlerts}
                onCheckedChange={(checked) =>
                  setNotifications((prev) => ({
                    ...prev,
                    priceAlerts: checked,
                  }))
                }
              />
            </div>
          </div>
        </div>

        {/* Security Section */}
        <div className="bg-card border border-border p-6">
          <div className="flex items-center gap-2 mb-6">
            <Shield className="h-5 w-5" />
            <h2 className="text-xl font-semibold">Security</h2>
          </div>

          <div className="space-y-4">
            <Button variant="outline" className="w-full justify-start">
              Change Password
            </Button>
            <Button variant="outline" className="w-full justify-start">
              Two-Factor Authentication
            </Button>
            <Button variant="outline" className="w-full justify-start">
              Connected Wallets
            </Button>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline">Cancel</Button>
          <Button onClick={handleSaveSettings}>Save Changes</Button>
        </div>
      </div>
    </div>
  );
}

