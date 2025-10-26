import { useState, useEffect } from "react";
import { ImageIcon, Loader2 } from "lucide-react";

interface MessageWithMediaProps {
  content: string;
  isOwn: boolean;
}

export function MessageWithMedia({ content, isOwn }: MessageWithMediaProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Parse message content to extract image reference
  useEffect(() => {
    const imageMatch = content.match(/\[IMAGE:(.+?)\]/);
    if (imageMatch) {
      const walrusRef = imageMatch[1];
      loadImageFromWalrus(walrusRef);
    }
  }, [content]);

  const loadImageFromWalrus = async (walrusRef: string) => {
    setIsLoadingImage(true);
    setImageError(false);
    
    try {
      console.log('Loading image from Walrus:', walrusRef);
      
      // Check if this is a temporary blob ID (starts with "temp_")
      if (walrusRef.startsWith('temp_')) {
        console.log('Loading temporary image from localStorage...');
        
        const storageKey = `walrus_temp_${walrusRef}`;
        const storedData = localStorage.getItem(storageKey);
        
        if (storedData) {
          const fileData = JSON.parse(storedData);
          const uint8Array = new Uint8Array(fileData.data);
          const blob = new Blob([uint8Array], { type: fileData.type });
          const imageUrl = URL.createObjectURL(blob);
          
          console.log('Temporary image loaded from localStorage');
          setImageUrl(imageUrl);
          return;
        } else {
          console.error('Temporary image not found in localStorage');
          setImageError(true);
          return;
        }
      }
      
      // For real Walrus blob IDs, try the aggregator URLs with retry logic
      let mediaUrl = `https://aggregator.walrus-testnet.walrus.space/v1/${walrusRef}`;
      
      // Test if the image exists by making a HEAD request
      let response = await fetch(mediaUrl, { method: 'HEAD' });
      
      // If not found, try alternative aggregator
      if (!response.ok) {
        mediaUrl = `https://aggregator.testnet.walrus.mirai.cloud/v1/${walrusRef}`;
        response = await fetch(mediaUrl, { method: 'HEAD' });
      }
      
      if (response.ok) {
        console.log('Image found at:', mediaUrl);
        setImageUrl(mediaUrl);
      } else {
        console.warn('Image not immediately available, implementing retry with exponential backoff...');
        
        // Implement retry with exponential backoff for blob propagation
        let retryCount = 0;
        const maxRetries = 5;
        const baseDelay = 2000; // 2 seconds
        
        const retryWithBackoff = async () => {
          if (retryCount >= maxRetries) {
            console.error('Max retries reached, image not found');
            setImageError(true);
            setIsLoadingImage(false);
            return;
          }
          
          retryCount++;
          const delay = baseDelay * Math.pow(2, retryCount - 1); // Exponential backoff
          
          console.log(`Retry ${retryCount}/${maxRetries} after ${delay}ms delay...`);
          
          setTimeout(async () => {
            try {
              let retryUrl = `https://aggregator.walrus-testnet.walrus.space/v1/${walrusRef}`;
              let retryResponse = await fetch(retryUrl, { method: 'HEAD' });
              
              if (!retryResponse.ok) {
                retryUrl = `https://aggregator.testnet.walrus.mirai.cloud/v1/${walrusRef}`;
                retryResponse = await fetch(retryUrl, { method: 'HEAD' });
              }
              
              if (retryResponse.ok) {
                console.log(`Image found on retry ${retryCount} at:`, retryUrl);
                setImageUrl(retryUrl);
                setIsLoadingImage(false);
              } else {
                console.warn(`Retry ${retryCount} failed, trying again...`);
                retryWithBackoff();
              }
            } catch (retryError) {
              console.error(`Retry ${retryCount} failed:`, retryError);
              retryWithBackoff();
            }
          }, delay);
        };
        
        retryWithBackoff();
        return; // Keep loading state active during retries
      }
    } catch (error) {
      console.error('Failed to load image from Walrus:', error);
      setImageError(true);
    } finally {
      setIsLoadingImage(false);
    }
  };

  // Remove image reference from text content
  const textContent = content.replace(/\[IMAGE:.+?\]/g, '').trim();

  return (
    <>
      {imageUrl && (
        <div className="mb-2">
          <a href={imageUrl} target="_blank" rel="noopener noreferrer">
            <img 
              src={imageUrl} 
              alt="Sent image" 
              className="max-w-full h-auto max-h-[300px] rounded-lg object-cover cursor-pointer" 
            />
          </a>
        </div>
      )}
      {isLoadingImage && (
        <div className="flex items-center gap-2 text-muted-foreground mb-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading image... (retrying if needed)</span>
        </div>
      )}
      {imageError && (
        <div className="flex items-center gap-2 text-destructive mb-2">
          <ImageIcon className="h-4 w-4" />
          <span>Failed to load image</span>
        </div>
      )}
      {textContent && (
        <p className={`text-sm ${isOwn ? 'text-primary-foreground' : ''} whitespace-pre-wrap break-words`}>
          {textContent}
        </p>
      )}
    </>
  );
}
