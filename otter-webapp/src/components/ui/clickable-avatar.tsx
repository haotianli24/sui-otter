import React from 'react';
import { UserProfilePopup } from '@/components/ui/user-profile-popup';

interface ClickableAvatarProps {
  address: string;
  className?: string;
  children: React.ReactNode;
}

export function ClickableAvatar({ address, className, children }: ClickableAvatarProps) {
  const [isPopupOpen, setIsPopupOpen] = React.useState(false);
  const [popupPosition, setPopupPosition] = React.useState<{ x: number; y: number } | undefined>();

  const handleClick = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    // Calculate position for the popup
    const rect = event.currentTarget.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Position popup to the right of the avatar, or to the left if not enough space
    let x = rect.right + 10;
    let y = rect.top;
    
    // Adjust if popup would go off screen
    if (x + 320 > viewportWidth) {
      x = rect.left - 330; // 320px width + 10px margin
    }
    
    if (y + 400 > viewportHeight) {
      y = viewportHeight - 420; // 400px height + 20px margin
    }
    
    setPopupPosition({ x, y });
    setIsPopupOpen(true);
  };

  const handleClose = () => {
    setIsPopupOpen(false);
    setPopupPosition(undefined);
  };

  return (
    <>
      <div 
        className={`cursor-pointer hover:opacity-80 transition-opacity ${className}`}
        onClick={handleClick}
        title="Click to view profile"
      >
        {children}
      </div>
      
      <UserProfilePopup
        address={address}
        isOpen={isPopupOpen}
        onClose={handleClose}
        position={popupPosition}
      />
    </>
  );
}
