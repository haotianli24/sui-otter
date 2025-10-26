"use client";

import { Search, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { WalletConnection } from "@/components/wallet-connection";
import { currentUser } from "@/lib/mock-data";

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

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 p-0">
              <Avatar>
                <AvatarImage src="" alt={currentUser.name} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {currentUser.avatar}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="font-medium text-xl">{currentUser.name}</p>
                <p className="text-lg text-muted-foreground">
                  {currentUser.address}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="py-5 text-xl">Profile</DropdownMenuItem>
            <DropdownMenuItem className="py-5 text-xl">Settings</DropdownMenuItem>
            <DropdownMenuItem className="py-5 text-xl">Help & Support</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive py-5 text-xl">
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

