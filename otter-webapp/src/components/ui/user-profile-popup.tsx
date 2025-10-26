import React from 'react';
import { GradientAvatar } from '@/components/ui/gradient-avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Copy, ExternalLink, Globe } from 'lucide-react';
import { useUsername, useUserProfile } from '@/hooks/useUsernameRegistry';
import { getDisplayName } from '@/contexts/UserProfileContext';

interface UserProfilePopupProps {
  address: string;
  isOpen: boolean;
  onClose: () => void;
  position?: { x: number; y: number };
}

export function UserProfilePopup({ address, isOpen, onClose, position }: UserProfilePopupProps) {
  const { data: username, isLoading: usernameLoading } = useUsername(address);
  const { data: onChainProfile, isLoading: profileLoading } = useUserProfile(address);
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const isLoading = usernameLoading || profileLoading;
  const displayName = username || getDisplayName(address);

  const copyAddress = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/20"
        onClick={onClose}
      />

      {/* Popup */}
      <div
        className="fixed z-50 w-80"
        style={{
          left: position?.x ? `${position.x}px` : '50%',
          top: position?.y ? `${position.y}px` : '50%',
          transform: position ? 'none' : 'translate(-50%, -50%)',
        }}
      >
        <Card className="border border-border bg-white dark:bg-gray-900 shadow-lg backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">User Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Profile Picture and Basic Info */}
            <div className="flex items-center gap-4">
              <GradientAvatar 
                address={address}
                size="lg"
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg truncate">
                  {isLoading ? 'Loading...' : displayName}
                </h3>
                <p className="text-sm text-muted-foreground">
                  @{isLoading ? 'loading' : (username || `user_${address.slice(0, 8)}`)}
                </p>
              </div>
            </div>

            {/* Bio */}
            {(onChainProfile?.bio || isLoading) && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Bio</h4>
                <p className="text-sm">
                  {isLoading ? 'Loading...' : (onChainProfile?.bio || 'No bio available')}
                </p>
              </div>
            )}

            {/* Wallet Address */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Wallet Address</h4>
              <div className="flex items-center gap-2">
                <code className="text-xs bg-muted px-2 py-1 rounded flex-1 font-mono">
                  {formatAddress(address)}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyAddress}
                  className="h-8 w-8 p-0"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              {copied && (
                <p className="text-xs text-green-500/70">Address copied!</p>
              )}
            </div>

            {/* Website */}
            {onChainProfile?.website && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Website</h4>
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={onChainProfile.website.startsWith('http') ? onChainProfile.website : `https://${onChainProfile.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline truncate"
                  >
                    {onChainProfile.website}
                  </a>
                  <ExternalLink className="h-3 w-3 text-muted-foreground" />
                </div>
              </div>
            )}

            {/* Close Button */}
            <div className="pt-2">
              <Button
                variant="outline"
                onClick={onClose}
                className="w-full"
              >
                Close
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
