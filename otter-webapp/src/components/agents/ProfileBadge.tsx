import { User, TrendingUp, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserProfile, WalletActivity } from '@/lib/supabase';

interface ProfileBadgeProps {
  profile: UserProfile;
  walletActivity: WalletActivity | null;
  messageCount: number;
  onEdit: () => void;
}

export default function ProfileBadge({
  profile,
  walletActivity,
  messageCount,
  onEdit,
}: ProfileBadgeProps) {
  const insightCount = walletActivity ? 
    (walletActivity.defi_protocols.length + (walletActivity.nft_count > 0 ? 1 : 0)) : 0;

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="p-3 bg-green-500/10 rounded-full">
          <User className="h-6 w-6 text-green-500" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="card-heading truncate">
              {profile.username}AI
            </h3>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-500/10 text-green-500 text-xs rounded-full">
              <TrendingUp className="h-3 w-3" />
              Learning
            </span>
          </div>
          
          <p className="small-text mb-2">
            {profile.personality_summary}
          </p>

          {/* Stats */}
          <div className="flex gap-4 text-xs">
            <div>
              <span className="text-muted-foreground">Tone:</span>{' '}
              <span className="text-foreground capitalize">{profile.tone}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Interests:</span>{' '}
              <span className="text-foreground">{profile.interests.length}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Messages:</span>{' '}
              <span className="text-foreground">{messageCount}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Insights:</span>{' '}
              <span className="text-foreground">{insightCount}</span>
            </div>
          </div>
        </div>

        {/* Edit Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onEdit}
        >
          <Edit className="h-3 w-3 mr-1" />
          Edit
        </Button>
      </div>
    </div>
  );
}

