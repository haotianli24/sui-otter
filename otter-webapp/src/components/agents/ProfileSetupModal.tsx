import { useState } from 'react';
import { X, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { scanWallet, generatePersonalitySummary } from '@/lib/wallet-scanner';

interface ProfileSetupModalProps {
  onComplete: (profileData: ProfileData) => void;
  onSkip: () => void;
}

export interface ProfileData {
  username: string;
  tone: 'casual' | 'professional' | 'friendly' | 'degen';
  interests: string[];
  personality_summary: string;
}

const TONE_OPTIONS = [
  { value: 'casual' as const, label: 'Casual', description: 'Relaxed and conversational' },
  { value: 'professional' as const, label: 'Professional', description: 'Formal and concise' },
  { value: 'friendly' as const, label: 'Friendly', description: 'Warm and encouraging' },
  { value: 'degen' as const, label: 'Degen', description: 'Crypto-native slang' },
];

const INTEREST_OPTIONS = [
  'DeFi',
  'NFTs',
  'AI Agents',
  'Trading',
  'Gaming',
  'Staking',
  'Governance',
  'Community',
];

export default function ProfileSetupModal({ onComplete, onSkip }: ProfileSetupModalProps) {
  const [username, setUsername] = useState('');
  const [tone, setTone] = useState<'casual' | 'professional' | 'friendly' | 'degen'>('casual');
  const [interests, setInterests] = useState<string[]>([]);
  const [bio, setBio] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  
  const account = useCurrentAccount();
  const suiClient = useSuiClient();

  const handleInterestToggle = (interest: string) => {
    setInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const handleScanWallet = async () => {
    if (!account?.address) return;

    setScanning(true);
    try {
      const scanResult = await scanWallet(account.address, suiClient);
      const personalitySummary = generatePersonalitySummary(scanResult);
      
      setBio(personalitySummary);
      
      // Auto-select relevant interests based on scan
      const autoInterests: string[] = [];
      if (scanResult.nftCount > 0) autoInterests.push('NFTs');
      if (scanResult.defiProtocols.length > 0) autoInterests.push('DeFi', 'Trading');
      if (scanResult.transactionCount > 20) autoInterests.push('Community');
      
      setInterests(prev => [...new Set([...prev, ...autoInterests])]);
      setScanComplete(true);
    } catch (error) {
      console.error('Error scanning wallet:', error);
    } finally {
      setScanning(false);
    }
  };

  const handleSubmit = () => {
    const profileData: ProfileData = {
      username: username.trim() || 'User',
      tone,
      interests,
      personality_summary: bio || 'A Sui blockchain enthusiast',
    };
    
    onComplete(profileData);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-zinc-700 flex items-center justify-between sticky top-0 bg-zinc-900 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <Sparkles className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <h2 className="section-heading text-white">Create Your AI Twin</h2>
              <p className="small-text text-gray-400">Personalize OtterAI to match your style</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onSkip}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Username */}
          <div>
            <label className="block font-semibold text-white mb-2">
              Your Name
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your name or username"
              className="w-full px-4 py-2 bg-zinc-800 border border-zinc-600 text-white placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-400 mt-1">
              Your AI twin will be called "{username || 'User'}AI"
            </p>
          </div>

          {/* Tone */}
          <div>
            <label className="block font-semibold text-white mb-3">
              Speaking Tone
            </label>
            <div className="grid grid-cols-2 gap-3">
              {TONE_OPTIONS.map(option => (
                <button
                  key={option.value}
                  onClick={() => setTone(option.value)}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    tone === option.value
                      ? 'border-green-500 bg-green-500/20 text-white'
                      : 'border-zinc-600 bg-zinc-800/50 hover:border-green-500/50 text-gray-300'
                  }`}
                >
                  <div className="font-semibold">{option.label}</div>
                  <div className="text-xs text-gray-400">{option.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Interests */}
          <div>
            <label className="block font-semibold text-white mb-3">
              Your Interests
            </label>
            <div className="flex flex-wrap gap-2">
              {INTEREST_OPTIONS.map(interest => (
                <button
                  key={interest}
                  onClick={() => handleInterestToggle(interest)}
                  className={`px-4 py-2 rounded-full border-2 transition-all font-medium ${
                    interests.includes(interest)
                      ? 'border-green-500 bg-green-500/20 text-green-400'
                      : 'border-zinc-600 bg-zinc-800/50 text-gray-300 hover:border-green-500/50'
                  }`}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>

          {/* Wallet Scanner */}
          <div className="p-4 bg-zinc-800 border border-zinc-600 rounded-lg">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-white mb-1">Scan Your Wallet</h3>
                <p className="text-sm text-gray-400">
                  Automatically detect your on-chain activity and preferences
                </p>
              </div>
            </div>
            <Button
              onClick={handleScanWallet}
              disabled={scanning || !account?.address}
              className="w-full"
              variant={scanComplete ? "outline" : "default"}
            >
              {scanning ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Scanning blockchain...
                </>
              ) : scanComplete ? (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Scan Complete!
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Scan My Wallet
                </>
              )}
            </Button>
          </div>

          {/* Bio / Personality Summary */}
          <div>
            <label className="block font-semibold text-white mb-2">
              About You (Optional)
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell your AI twin about yourself... (or let the wallet scan fill this in)"
              rows={3}
              className="w-full px-4 py-2 bg-zinc-800 border border-zinc-600 text-white placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-zinc-700 bg-zinc-900 flex gap-3">
          <Button
            variant="outline"
            onClick={onSkip}
            className="flex-1 border-zinc-600 text-gray-300 hover:bg-zinc-800 hover:text-white"
          >
            Skip for Now
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!username.trim()}
            className="flex-1 bg-green-500 hover:bg-green-600 text-white disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Create My Twin
          </Button>
        </div>
      </div>
    </div>
  );
}

