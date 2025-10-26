import { useState } from "react";
import { useTheme } from "@/components/theme-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Bell, Lock, Palette } from "lucide-react";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [notificationSettings, setNotificationSettings] = useState({
    messages: true,
    channels: true,
    marketing: false,
  });

  const [privacySettings, setPrivacySettings] = useState({
    showOnlineStatus: true,
    allowMessages: true,
    showProfile: true,
  });

  const handleThemeChange = (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-heading">Settings</h1>
        <p className="page-subtitle">Manage your preferences and account settings</p>
      </div>

      {/* Theme Settings */}
      <Card className="border border-border bg-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            <CardTitle>Appearance</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <p className="text-sm muted-text">Theme</p>
            <div className="grid grid-cols-3 gap-3">
              {["light", "dark", "system"].map((t) => (
                <Button
                  key={t}
                  variant="outline"
                  className={`capitalize transition-all duration-200 font-medium cursor-pointer ${theme === t
                      ? "bg-primary text-primary-foreground border-primary shadow-md ring-2 ring-primary/20"
                      : "bg-muted/30 text-muted-foreground border-muted hover:bg-muted/50 hover:text-foreground hover:border-muted-foreground/50"
                  }`}
                  onClick={() => {
                    console.log('Setting theme to', t);
                    handleThemeChange(t as "light" | "dark" | "system");
                  }}
                >
                  {t}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card className="border border-border bg-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <CardTitle>Notifications</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            {[
              {
                key: "messages" as const,
                label: "Message Notifications",
                description: "Get notified when you receive new messages",
              },
              {
                key: "channels" as const,
                label: "Channel Updates",
                description: "Get notified about activity in channels you joined",
              },
              {
                key: "marketing" as const,
                label: "Marketing Emails",
                description: "Receive updates about new features and announcements",
              },
            ].map((setting) => (
              <div
                key={setting.key}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
              >
                <div>
                  <p className="font-medium">{setting.label}</p>
                  <p className="text-sm muted-text">{setting.description}</p>
                </div>
                <Switch
                  checked={notificationSettings[setting.key]}
                  onCheckedChange={(checked) =>
                    setNotificationSettings((prev) => ({
                      ...prev,
                      [setting.key]: checked,
                    }))
                  }
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Privacy Settings */}
      <Card className="border border-border bg-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            <CardTitle>Privacy & Security</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            {[
              {
                key: "showOnlineStatus" as const,
                label: "Show Online Status",
                description: "Let others see when you're online",
              },
              {
                key: "allowMessages" as const,
                label: "Allow Direct Messages",
                description: "Allow other users to send you direct messages",
              },
              {
                key: "showProfile" as const,
                label: "Show Public Profile",
                description: "Make your profile visible to other users",
              },
            ].map((setting) => (
              <div
                key={setting.key}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
              >
                <div>
                  <p className="font-medium">{setting.label}</p>
                  <p className="text-sm text-muted-foreground">{setting.description}</p>
                </div>
                <Switch
                  checked={privacySettings[setting.key]}
                  onCheckedChange={(checked) =>
                    setPrivacySettings((prev) => ({
                      ...prev,
                      [setting.key]: checked,
                    }))
                  }
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border border-destructive/50 bg-card">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" className="w-full">
            Clear Cache
          </Button>
          <Button variant="outline" className="w-full">
            Reset to Defaults
          </Button>
          <Button variant="destructive" className="w-full">
            Delete Account Data
          </Button>
        </CardContent>
      </Card>

      {/* Save Changes */}
      <div className="flex gap-3">
        <Button className="flex-1">Save Changes</Button>
        <Button variant="outline" className="flex-1">
          Cancel
        </Button>
      </div>
    </div>
  );
}
