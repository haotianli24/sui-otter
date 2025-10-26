import { useCurrentAccount } from "@mysten/dapp-kit";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Mail, Globe, Edit3, Save, X, Loader2 } from "lucide-react";
import { useState } from "react";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { useSetUsername, useUserProfile as useOnChainProfile, useCheckUsernameAvailability } from "@/hooks/useUsernameRegistry";

export default function ProfilePage() {
  const currentAccount = useCurrentAccount();
  const { profile, updateUsername, updateProfile, isLoading } = useUserProfile();
  const onChainProfile = useOnChainProfile(currentAccount?.address || '');
  const setUsernameMutation = useSetUsername();
  
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    username: '',
    bio: '',
    email: '',
    website: '',
  });
  
  const { data: usernameAvailable, isLoading: checkingAvailability } = useCheckUsernameAvailability(editForm.username);

  if (!currentAccount) {
    return (
      <div className="page-container">
        <h1 className="page-heading mb-2">Profile</h1>
        <p className="page-subtitle">Please connect your wallet to view your profile.</p>
      </div>
    );
  }

  if (isLoading || !profile) {
    return (
      <div className="page-container">
        <h1 className="page-heading mb-2">Profile</h1>
        <p className="page-subtitle">Loading profile...</p>
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

  const startEditing = () => {
    // Use on-chain data if available, otherwise fall back to local profile
    const currentProfile = onChainProfile.data || profile;
    setEditForm({
      username: currentProfile?.username || '',
      bio: currentProfile?.bio || '',
      email: profile?.email || '',
      website: currentProfile?.website || profile?.website || '',
    });
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditForm({
      username: '',
      bio: '',
      email: '',
      website: '',
    });
  };

  const saveProfile = async () => {
    if (!editForm.username.trim()) return;

    try {
      // Set username on-chain
      await setUsernameMutation.mutateAsync({
        username: editForm.username.trim(),
        bio: editForm.bio.trim(),
        avatarUrl: '', // TODO: Add avatar upload
        website: editForm.website.trim(),
      });

      // Also update local profile for immediate UI updates
      updateUsername(editForm.username.trim());
      updateProfile({
        bio: editForm.bio.trim() || undefined,
        email: editForm.email.trim() || undefined,
        website: editForm.website.trim() || undefined,
      });
      
      setIsEditing(false);
    } catch (error: any) {
      console.error('Error saving profile:', error);
      
      // Check for specific error types
      if (error?.message?.includes('EUsernameAlreadyTaken') || 
          error?.message?.includes('MoveAbort') && error?.message?.includes('1')) {
        alert('Username is already taken. Please choose a different username.');
      } else if (error?.message?.includes('EUsernameTooLong')) {
        alert('Username is too long. Please choose a shorter username.');
      } else if (error?.message?.includes('EInvalidUsername')) {
        alert('Invalid username. Please choose a valid username.');
      } else {
        alert('Failed to save profile. Please try again.');
      }
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value,
    }));
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
              <div className="flex items-center gap-2">
                <h2 className="section-heading">
                  {onChainProfile.data?.username || profile?.displayName || 'User'}
                </h2>
                {!isEditing && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={startEditing}
                    className="h-6 w-6 p-0"
                  >
                    <Edit3 className="h-3 w-3" />
                  </Button>
                )}
              </div>
              <p className="page-subtitle">
                @{onChainProfile.data?.username || profile?.username || 'username'}
              </p>
              <p className="text-xs text-muted-foreground">Connected to Sui Network</p>
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

          {/* Profile Editing Form */}
          {isEditing && (
            <div className="space-y-4 p-4 bg-muted/30 rounded-lg border border-border">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Edit Profile</h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={cancelEditing}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={saveProfile}
                    disabled={!editForm.username.trim() || setUsernameMutation.isPending || usernameAvailable === false}
                  >
                    {setUsernameMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-1" />
                        Save
                      </>
                    )}
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username *</Label>
                  <div className="relative">
                    <Input
                      id="username"
                      value={editForm.username}
                      onChange={(e) => handleInputChange('username', e.target.value)}
                      placeholder="Enter your username"
                      maxLength={30}
                      className={editForm.username && !usernameAvailable ? 'border-red-500' : ''}
                    />
                    {checkingAvailability && (
                      <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin" />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-muted-foreground">
                      This will be your display name in all groups and messages
                    </p>
                    {editForm.username && usernameAvailable === false && (
                      <span className="text-xs text-red-500">Username not available</span>
                    )}
                    {editForm.username && usernameAvailable === true && (
                      <span className="text-xs text-green-500">Username available</span>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={editForm.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="your@email.com"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={editForm.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  placeholder="Tell us about yourself..."
                  rows={3}
                  maxLength={200}
                />
                <p className="text-xs text-muted-foreground">
                  {editForm.bio.length}/200 characters
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={editForm.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  placeholder="https://yourwebsite.com"
                />
              </div>
            </div>
          )}

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
          {(onChainProfile.data?.bio || profile?.bio) && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="muted-text mb-2">Bio</p>
              <p className="body-text">{onChainProfile.data?.bio || profile?.bio}</p>
            </div>
          )}
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <Mail className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="muted-text">Email</p>
              <p className="body-text">{profile?.email || "Not set"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <Globe className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="muted-text">Website</p>
              <p className="body-text">
                {(onChainProfile.data?.website || profile?.website) ? (
                  <a 
                    href={onChainProfile.data?.website || profile?.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {onChainProfile.data?.website || profile?.website}
                  </a>
                ) : (
                  "Not set"
                )}
              </p>
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
