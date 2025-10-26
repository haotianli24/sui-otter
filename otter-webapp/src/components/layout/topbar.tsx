

import { Search, Moon, Sun } from "lucide-react";
import { useTheme } from "../theme-provider";
import { Button } from "@/components/ui/button";
import { WalletConnection } from "@/components/wallet-connection";

export function TopBar() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="h-28 border-b border-border bg-card flex items-center justify-between px-6">
      {/* Search */}
      <div className="flex-1 max-w-3xl">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search messages, users, or communities..."
            className="w-full h-16 pl-16 pr-4 bg-background border border-input focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Wallet connection */}
        <WalletConnection />

        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </div>
    </div>
  );
}

