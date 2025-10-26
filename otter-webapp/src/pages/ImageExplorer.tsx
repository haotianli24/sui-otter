import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { RefreshCw, Image as ImageIcon, Download, ExternalLink } from 'lucide-react';

interface ImageRecord {
  id: string;
  blobId: string;
  url: string;
  filename?: string;
  size?: number;
  category: 'image' | 'video' | 'document' | 'other';
  uploadedAt: number;
  messageContent?: string;
}

export function ImageExplorer() {
  const [images, setImages] = useState<ImageRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<ImageRecord | null>(null);

  // Load images from localStorage and recent messages
  const loadImages = async () => {
    setLoading(true);
    try {
      const imageRecords: ImageRecord[] = [];

      // Load from localStorage fallback files
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('walrus_fallback_')) {
          try {
            const data = JSON.parse(localStorage.getItem(key) || '{}');
            if (data.url && data.metadata) {
              imageRecords.push({
                id: key,
                blobId: key.replace('walrus_fallback_', ''),
                url: data.url,
                filename: data.metadata.filename,
                size: data.metadata.size,
                category: data.metadata.category || 'image',
                uploadedAt: data.uploadedAt || Date.now(),
                messageContent: data.messageContent || 'Local fallback file'
              });
            }
          } catch (e) {
            console.warn('Failed to parse localStorage item:', key);
          }
        }
      }

      // Try to load from recent messages (this would need to be implemented)
      // For now, we'll just show localStorage files

      setImages(imageRecords.sort((a, b) => b.uploadedAt - a.uploadedAt));
    } catch (error) {
      console.error('Failed to load images:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadImages();
  }, []);

  const downloadImage = async (image: ImageRecord) => {
    try {
      const response = await fetch(image.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = image.filename || `image_${image.blobId.substring(0, 8)}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to download image:', error);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-6 w-6" />
                Sui Testnet Image Explorer
              </CardTitle>
              <CardDescription>
                View and manage all uploaded images from your messaging app
              </CardDescription>
            </div>
            <Button onClick={loadImages} disabled={loading} variant="outline">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {images.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No images found</p>
              <p className="text-sm">Upload some images in the messaging app to see them here</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {images.map((image) => (
                <Card 
                  key={image.id} 
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => setSelectedImage(image)}
                >
                  <div className="aspect-square relative overflow-hidden rounded-t-lg">
                    <img
                      src={image.url}
                      alt={image.filename || 'Uploaded image'}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzY2NjY2NiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIEVycm9yPC90ZXh0Pjwvc3ZnPg==';
                      }}
                    />
                    <div className="absolute top-2 right-2">
                      <Badge variant="secondary" className="text-xs">
                        {image.category}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-3">
                    <div className="space-y-2">
                      <p className="font-medium text-sm truncate">
                        {image.filename || `Image ${image.blobId.substring(0, 8)}`}
                      </p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{formatFileSize(image.size)}</span>
                        <span>{formatDate(image.uploadedAt)}</span>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 h-8 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadImage(image);
                          }}
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Download
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 h-8 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedImage(image);
                          }}
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          View
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-4xl max-h-[90vh] overflow-hidden">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{selectedImage.filename || 'Image Viewer'}</CardTitle>
                  <CardDescription>
                    Blob ID: {selectedImage.blobId}
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setSelectedImage(null)}
                >
                  Close
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="relative">
                <img
                  src={selectedImage.url}
                  alt={selectedImage.filename || 'Selected image'}
                  className="w-full h-auto max-h-[70vh] object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyMCIgZmlsbD0iIzY2NjY2NiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIEVycm9yPC90ZXh0Pjwvc3ZnPg==';
                  }}
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
                  <div className="flex items-center justify-between text-white">
                    <div>
                      <p className="font-medium">{selectedImage.filename || 'Unknown filename'}</p>
                      <p className="text-sm opacity-75">
                        {formatFileSize(selectedImage.size)} • {formatDate(selectedImage.uploadedAt)}
                      </p>
                    </div>
                    <Button
                      onClick={() => downloadImage(selectedImage)}
                      variant="secondary"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
