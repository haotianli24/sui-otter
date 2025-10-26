

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
} from "lucide-react";

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
                <div className="h-20 flex items-center px-6 border-b border-border">
                    <h1 className="text-2xl font-bold text-foreground">
                        OTTER
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
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                            <span className="text-xs font-bold text-primary-foreground">S</span>
                        </div>
                        <span className="text-sm">Powered by Sui</span>
                    </div>
                </div>
            </div>
        </>
    );
}

