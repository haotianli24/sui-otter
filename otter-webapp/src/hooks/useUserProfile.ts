import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured, UserProfile, WalletActivity } from '@/lib/supabase';
import { scanWallet, generatePersonalitySummary } from '@/lib/wallet-scanner';
import { useSuiClient } from '@mysten/dapp-kit';

export function useUserProfile(walletAddress: string | undefined) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [walletActivity, setWalletActivity] = useState<WalletActivity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const suiClient = useSuiClient();

  // Load profile from Supabase
  const loadProfile = async (address: string) => {
    if (!isSupabaseConfigured || !supabase) {
      return null;
    }
    
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('wallet_address', address)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      return data;
    } catch (err) {
      console.error('Error loading profile:', err);
      return null;
    }
  };

  // Load wallet activity
  const loadWalletActivity = async (address: string) => {
    if (!isSupabaseConfigured || !supabase) {
      return null;
    }
    
    try {
      const { data, error } = await supabase
        .from('wallet_activity')
        .select('*')
        .eq('wallet_address', address)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data;
    } catch (err) {
      console.error('Error loading wallet activity:', err);
      return null;
    }
  };

  // Create new profile
  const createProfile = async (profileData: Partial<UserProfile>) => {
    if (!walletAddress) return null;
    
    if (!isSupabaseConfigured || !supabase) {
      console.warn('Supabase not configured. Profile not saved.');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .insert({
          wallet_address: walletAddress,
          username: profileData.username || 'User',
          tone: profileData.tone || 'casual',
          interests: profileData.interests || [],
          personality_summary: profileData.personality_summary || 'A Sui blockchain enthusiast',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      setProfile(data);
      return data;
    } catch (err: any) {
      setError(err.message);
      console.error('Error creating profile:', err);
      return null;
    }
  };

  // Update profile
  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!walletAddress) return null;
    
    if (!isSupabaseConfigured || !supabase) {
      console.warn('Supabase not configured. Profile not updated.');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('wallet_address', walletAddress)
        .select()
        .single();

      if (error) throw error;

      setProfile(data);
      return data;
    } catch (err: any) {
      setError(err.message);
      console.error('Error updating profile:', err);
      return null;
    }
  };

  // Scan and update wallet activity
  const scanAndUpdateWallet = async (address: string) => {
    try {
      const scanResult = await scanWallet(address, suiClient);
      const personalitySummary = generatePersonalitySummary(scanResult);

      if (isSupabaseConfigured && supabase) {
        // Update wallet activity
        const { data: activityData, error: activityError } = await supabase
          .from('wallet_activity')
          .upsert({
            wallet_address: address,
            nft_count: scanResult.nftCount,
            transaction_count: scanResult.transactionCount,
            defi_protocols: scanResult.defiProtocols,
            last_scanned: new Date().toISOString(),
          })
          .select()
          .single();

        if (activityError) throw activityError;

        setWalletActivity(activityData);

        // Update profile personality summary if it exists
        if (profile) {
          await updateProfile({
            personality_summary: personalitySummary,
          });
        }
      }

      return scanResult;
    } catch (err: any) {
      console.error('Error scanning wallet:', err);
      setError(err.message);
      return null;
    }
  };

  // Load profile on mount
  useEffect(() => {
    const initialize = async () => {
      if (!walletAddress) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      const [profileData, activityData] = await Promise.all([
        loadProfile(walletAddress),
        loadWalletActivity(walletAddress),
      ]);

      setProfile(profileData);
      setWalletActivity(activityData);
      setLoading(false);
    };

    initialize();
  }, [walletAddress]);

  return {
    profile,
    walletActivity,
    loading,
    error,
    createProfile,
    updateProfile,
    scanAndUpdateWallet,
    hasProfile: !!profile,
  };
}

