

import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    MessageSquare,
    Users,
    Compass,
    User,
    Settings,
    Menu,
    X,
    Waves,
    TrendingUp,
} from "lucide-react";
import SuiLogo from "/sui-sui-logo.svg";

const navItems = [
    {
        name: "DMs",
        href: "/messages",
        icon: MessageSquare,
    },
    {
        name: "Groups",
        href: "/groups",
        icon: Users,
    },
    {
        name: "Stream",
        href: "/stream",
        icon: Waves,
    },
    {
        name: "Agents",
        href: "/copy-trading",
        icon: TrendingUp,
    },
    {
        name: "Discover",
        href: "/discover",
        icon: Compass,
    },
    {
        name: "Profile",
        href: "/profile",
        icon: User,
    },
    {
        name: "Settings",
        href: "/settings",
        icon: Settings,
    },
];

export function Sidebar() {
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <>
            {/* Mobile menu button */}
            <Button
                variant="ghost"
                size="icon"
                className="md:hidden fixed top-4 left-4 z-50"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
                {isMobileMenuOpen ? (
                    <X className="h-5 w-5" />
                ) : (
                    <Menu className="h-5 w-5" />
                )}
            </Button>

            {/* Overlay for mobile */}
            {isMobileMenuOpen && (
                <div
                    className="md:hidden fixed inset-0 bg-black/50 z-40"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div
                className={cn(
                    "w-64 h-screen bg-card border-r border-border flex flex-col transition-transform md:translate-x-0 fixed md:relative z-40",
                    isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                {/* Logo */}
                <div className="h-20 flex items-center justify-center px-6 border-b border-border relative">
                    <h1 className="text-4xl font-bold font-dato flex">
                        {['o', 't', 't', 'e', 'r'].map((letter, index) => (
                            <span
                                key={index}
                                className="wave-letter"
                                style={{
                                    animationDelay: `${index * 0.2}s`,
                                }}
                            >
                                {letter}
                            </span>
                        ))}
                    </h1>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname.startsWith(item.href);

                        return (
                            <Link
                                key={item.href}
                                to={item.href}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={cn(
                                    "flex items-center gap-4 px-4 py-5 text-lg font-semibold transition-colors",
                                    isActive
                                        ? "bg-primary text-primary-foreground"
                                        : "text-foreground hover:bg-accent hover:text-accent-foreground"
                                )}
                            >
                                <Icon className="h-5 w-5" />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div className="p-6 border-t border-border">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <span className="text-sm font-dato">POWERED BY SUI</span>
                        <img
                            src={SuiLogo}
                            alt="Sui Logo"
                            className="w-6 h-6"
                        />
                    </div>
                </div>
            </div>
        </>
    );
}

