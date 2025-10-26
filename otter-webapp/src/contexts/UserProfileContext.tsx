import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { useUsername, useUserProfile as useOnChainUserProfile, useSetUsername } from '../hooks/useUsernameRegistry';

interface UserProfile {
  address: string;
  username: string;
  displayName: string;
  bio?: string;
  avatar?: string;
  email?: string;
  website?: string;
}

interface UserProfileContextType {
  profile: UserProfile | null;
  updateUsername: (username: string, bio?: string, avatarUrl?: string, website?: string) => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => void;
  isLoading: boolean;
  isOnChainProfile: boolean;
}

const UserProfileContext = createContext<UserProfileContextType | undefined>(undefined);

const STORAGE_KEY = 'otter_user_profiles';

export function UserProfileProvider({ children }: { children: ReactNode }) {
  const currentAccount = useCurrentAccount();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOnChainProfile, setIsOnChainProfile] = useState(false);

  // Fetch on-chain data
  const { data: onChainUsername, isLoading: usernameLoading } = useUsername(currentAccount?.address || '');
  const { data: onChainProfile, isLoading: profileLoading } = useOnChainUserProfile(currentAccount?.address || '');
  const setUsernameMutation = useSetUsername();

  // Load profile from on-chain data and localStorage when account changes
  useEffect(() => {
    if (!currentAccount?.address) {
      setProfile(null);
      setIsOnChainProfile(false);
      return;
    }

    setIsLoading(usernameLoading || profileLoading);

    // Prioritize on-chain data
    if (onChainProfile) {
      const onChainUserProfile: UserProfile = {
        address: currentAccount.address,
        username: onChainProfile.username,
        displayName: onChainProfile.username,
        bio: onChainProfile.bio,
        avatar: onChainProfile.avatarUrl,
        website: onChainProfile.website,
      };
      setProfile(onChainUserProfile);
      setIsOnChainProfile(true);
      setIsLoading(false);
      return;
    }

    // Fallback to on-chain username if available
    if (onChainUsername) {
      const usernameProfile: UserProfile = {
        address: currentAccount.address,
        username: onChainUsername,
        displayName: onChainUsername,
        bio: '',
      };
      setProfile(usernameProfile);
      setIsOnChainProfile(true);
      setIsLoading(false);
      return;
    }

    // Fallback to localStorage
    try {
      const storedProfiles = localStorage.getItem(STORAGE_KEY);
      const profiles: Record<string, UserProfile> = storedProfiles ? JSON.parse(storedProfiles) : {};
      
      const userProfile = profiles[currentAccount.address];
      if (userProfile) {
        setProfile(userProfile);
        setIsOnChainProfile(false);
      } else {
        // Create default profile for new user
        const defaultProfile: UserProfile = {
          address: currentAccount.address,
          username: `user_${currentAccount.address.slice(0, 8)}`,
          displayName: `User ${currentAccount.address.slice(0, 8)}`,
          bio: '',
        };
        setProfile(defaultProfile);
        setIsOnChainProfile(false);
        // Save default profile
        profiles[currentAccount.address] = defaultProfile;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      // Create fallback profile
      const fallbackProfile: UserProfile = {
        address: currentAccount.address,
        username: `user_${currentAccount.address.slice(0, 8)}`,
        displayName: `User ${currentAccount.address.slice(0, 8)}`,
        bio: '',
      };
      setProfile(fallbackProfile);
      setIsOnChainProfile(false);
    } finally {
      setIsLoading(false);
    }
  }, [currentAccount?.address, onChainProfile, onChainUsername, usernameLoading, profileLoading]);

  const updateUsername = async (username: string, bio?: string, avatarUrl?: string, website?: string) => {
    if (!profile || !currentAccount?.address) return;

    try {
      // Try to set username on-chain first
      await setUsernameMutation.mutateAsync({
        username: username.trim(),
        bio: bio || profile.bio || '',
        avatarUrl: avatarUrl || profile.avatar || '',
        website: website || profile.website || '',
      });

      // Update local state
      const updatedProfile = {
        ...profile,
        username: username.trim(),
        displayName: username.trim() || profile.displayName,
        bio: bio || profile.bio,
        avatar: avatarUrl || profile.avatar,
        website: website || profile.website,
      };

      setProfile(updatedProfile);
      setIsOnChainProfile(true);
    } catch (error) {
      console.error('Error setting username on-chain:', error);
      
      // Fallback to localStorage only
      const updatedProfile = {
        ...profile,
        username: username.trim(),
        displayName: username.trim() || profile.displayName,
        bio: bio || profile.bio,
        avatar: avatarUrl || profile.avatar,
        website: website || profile.website,
      };

      setProfile(updatedProfile);
      setIsOnChainProfile(false);
      
      // Save to localStorage
      try {
        const storedProfiles = localStorage.getItem(STORAGE_KEY);
        const profiles: Record<string, UserProfile> = storedProfiles ? JSON.parse(storedProfiles) : {};
        profiles[currentAccount.address] = updatedProfile;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
      } catch (storageError) {
        console.error('Error saving username to localStorage:', storageError);
      }
    }
  };

  const updateProfile = (updates: Partial<UserProfile>) => {
    if (!profile || !currentAccount?.address) return;

    const updatedProfile = {
      ...profile,
      ...updates,
    };

    setProfile(updatedProfile);
    
    // Save to localStorage
    try {
      const storedProfiles = localStorage.getItem(STORAGE_KEY);
      const profiles: Record<string, UserProfile> = storedProfiles ? JSON.parse(storedProfiles) : {};
      profiles[currentAccount.address] = updatedProfile;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
    } catch (error) {
      console.error('Error saving profile:', error);
    }
  };

  return (
    <UserProfileContext.Provider value={{
      profile,
      updateUsername,
      updateProfile,
      isLoading,
      isOnChainProfile,
    }}>
      {children}
    </UserProfileContext.Provider>
  );
}

export function useUserProfile() {
  const context = useContext(UserProfileContext);
  if (context === undefined) {
    throw new Error('useUserProfile must be used within a UserProfileProvider');
  }
  return context;
}

// Helper function to get display name for any address
export function getDisplayName(address: string): string {
  // First try to get from localStorage (for immediate updates)
  try {
    const storedProfiles = localStorage.getItem(STORAGE_KEY);
    const profiles: Record<string, UserProfile> = storedProfiles ? JSON.parse(storedProfiles) : {};
    const userProfile = profiles[address];
    if (userProfile?.displayName) {
      return userProfile.displayName;
    }
  } catch (error) {
    console.error('Error getting display name from localStorage:', error);
  }

  // TODO: In production, this would also check on-chain data
  // For now, fallback to address-based name
  return `User ${address.slice(0, 8)}`;
}

// Helper function to get username for any address
export function getUsername(address: string): string {
  // First try to get from localStorage
  try {
    const storedProfiles = localStorage.getItem(STORAGE_KEY);
    const profiles: Record<string, UserProfile> = storedProfiles ? JSON.parse(storedProfiles) : {};
    const userProfile = profiles[address];
    if (userProfile?.username) {
      return userProfile.username;
    }
  } catch (error) {
    console.error('Error getting username from localStorage:', error);
  }

  // TODO: In production, this would also check on-chain data
  // For now, fallback to address-based username
  return `user_${address.slice(0, 8)}`;
}
