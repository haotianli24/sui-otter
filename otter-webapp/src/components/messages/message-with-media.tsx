import { useState, useEffect } from "react";
import { ImageIcon, Loader2, Eye, EyeOff, Video, FileText, File, Download } from "lucide-react";
import { detectTransactionHash } from "../../lib/transaction-detector";
import TransactionEmbed from "../transaction/TransactionEmbed";
import { Button } from "../ui/button";
import { parseFileReference, getFileUrl, getFallbackFile, getFileIcon, formatFileSize } from "../../lib/walrus-service";

interface MessageWithMediaProps {
  content: string;
  isOwn: boolean;
  senderName?: string;
  groupName?: string;
}

export function MessageWithMedia({ content, isOwn, senderName, groupName }: MessageWithMediaProps) {
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [isLoadingMedia, setIsLoadingMedia] = useState(false);
  const [mediaError, setMediaError] = useState(false);
  const [showTransactionEmbed, setShowTransactionEmbed] = useState(true);
  const [fileMetadata, setFileMetadata] = useState<{
    category: 'image' | 'video' | 'document' | 'other';
    filename?: string;
    size?: number;
  } | null>(null);

  // Parse message content to extract file reference
  useEffect(() => {
    const fileRef = parseFileReference(content);
    if (fileRef) {
      loadMediaFromWalrus(fileRef);
    }
  }, [content]);

  const loadMediaFromWalrus = async (fileRef: { type: 'legacy' | 'new'; category?: 'image' | 'video' | 'document' | 'other'; blobId: string; filename?: string }) => {
    setIsLoadingMedia(true);
    setMediaError(false);

    try {
      console.log('Loading media from Walrus:', fileRef);

      // Set file metadata
      setFileMetadata({
        category: fileRef.category || 'image',
        filename: fileRef.filename,
        size: undefined // We don't have size info from the reference
      });

      // Check if this is a temporary blob ID (starts with "temp_")
      if (fileRef.blobId.startsWith('temp_')) {
        console.log('Loading temporary file from localStorage...');

        const fallbackFile = getFallbackFile(fileRef.blobId);
        if (fallbackFile) {
          console.log('Temporary file loaded from localStorage');
          setMediaUrl(fallbackFile.url);
          setFileMetadata({
            category: fallbackFile.metadata.category,
            filename: fallbackFile.metadata.filename,
            size: fallbackFile.metadata.size
          });
          return;
        } else {
          console.error('Temporary file not found in localStorage');
          setMediaError(true);
          return;
        }
      }

      // For real Walrus blob IDs, get the file URL
      try {
        const url = await getFileUrl(fileRef.blobId);
        console.log('File found at:', url);
        setMediaUrl(url);
        setIsLoadingMedia(false);
        return;
      } catch (error) {
        console.warn('File not immediately available, trying different approaches...');

        // Try multiple approaches with different delays (testnet is slower)
        const approaches = [
          { delay: 2000, name: 'Quick retry' },
          { delay: 5000, name: 'Standard retry' },
          { delay: 10000, name: 'Extended retry' },
          { delay: 30000, name: 'Long retry' }
        ];

        let approachIndex = 0;

        const tryNextApproach = async () => {
          if (approachIndex >= approaches.length) {
            console.log('All approaches exhausted - file may not be available yet');
            setMediaError(true);
            setIsLoadingMedia(false);
            return;
          }

          const approach = approaches[approachIndex];
          console.log(`Trying ${approach.name} after ${approach.delay}ms delay...`);

          setTimeout(async () => {
            try {
              const retryUrl = await getFileUrl(fileRef.blobId);
              console.log(`File found with ${approach.name} at:`, retryUrl);
              setMediaUrl(retryUrl);
              setIsLoadingMedia(false);
            } catch (retryError) {
              console.warn(`${approach.name} failed:`, retryError);
              approachIndex++;
              tryNextApproach();
            }
          }, approach.delay);
        };

        tryNextApproach();
        return; // Keep loading state active during retries
      }
    } catch (error) {
      console.error('Failed to load media from Walrus:', error);
      setMediaError(true);
    } finally {
      setIsLoadingMedia(false);
    }
  };

  // Remove file reference from text content
  const textContent = content.replace(/\[(?:IMAGE|FILE|image|video|document|other):.+?\]/g, '').trim();

  // Detect transaction hash in the text content
  const transactionHash = detectTransactionHash(textContent);


  return (
    <>
      {mediaUrl && fileMetadata && (
        <div className="mb-2">
          {fileMetadata.category === 'image' && (
            <a href={mediaUrl} target="_blank" rel="noopener noreferrer">
              <img
                src={mediaUrl}
                alt="Sent image"
                className="max-w-full h-auto max-h-[300px] rounded-lg object-cover cursor-pointer"
              />
            </a>
          )}
          {fileMetadata.category === 'video' && (
            <video
              src={mediaUrl}
              controls
              className="max-w-full h-auto max-h-[300px] rounded-lg"
            />
          )}
          {(fileMetadata.category === 'document' || fileMetadata.category === 'other') && (
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg max-w-[400px]">
              {(() => {
                const IconComponent = getFileIcon(fileMetadata.category);
                return <IconComponent className="h-8 w-8 text-muted-foreground" />;
              })()}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{fileMetadata.filename || 'File'}</p>
                {fileMetadata.size && (
                  <p className="text-xs text-muted-foreground">{formatFileSize(fileMetadata.size)}</p>
                )}
              </div>
              <a
                href={mediaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-primary hover:text-primary/80"
              >
                <Download className="h-3 w-3" />
                Download
              </a>
            </div>
          )}
        </div>
      )}
      {isLoadingMedia && (
        <div className={`flex items-center gap-2 mb-2 ${isOwn ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading file... (retrying if needed)</span>
        </div>
      )}
      {mediaError && (
        <div className={`flex items-center gap-2 mb-2 ${isOwn ? 'text-primary-foreground/80' : 'text-destructive/70'}`}>
          <ImageIcon className="h-4 w-4" />
          <span>Image processing... (testnet delay)</span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const fileRef = parseFileReference(content);
              if (fileRef) {
                loadMediaFromWalrus(fileRef);
              }
            }}
            className="ml-2 h-6 px-2 text-xs"
          >
            Retry
          </Button>
        </div>
      )}
      {textContent && (
        <p className={`text-sm ${isOwn ? 'text-primary-foreground' : 'text-foreground'} whitespace-pre-wrap break-words`}>
          {textContent}
        </p>
      )}

      {/* Transaction Toggle Button */}
      {transactionHash && (
        <div className="mt-2 flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowTransactionEmbed(!showTransactionEmbed)}
            className={`h-6 px-2 text-xs ${isOwn ? 'text-primary-foreground hover:text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {showTransactionEmbed ? (
              <>
                <EyeOff className="h-3 w-3 mr-1" />
                Hide Transaction
              </>
            ) : (
              <>
                <Eye className="h-3 w-3 mr-1" />
                Show Transaction
              </>
            )}
          </Button>
        </div>
      )}

      {/* Transaction Embed */}
      {transactionHash && showTransactionEmbed && (
        <div className="mt-2">
          <TransactionEmbed
            digest={transactionHash}
            senderName={senderName || "Unknown"}
            isCurrentUser={isOwn}
            groupName={groupName || "Channel"}
          />
        </div>
      )}
    </>
  );
}
