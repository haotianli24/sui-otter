import { WalrusStorageAdapter } from '@mysten/messaging';
import { Video, FileText, File, Image } from 'lucide-react';

export interface FileUploadResult {
    blobId: string;
    filename: string;
    mimeType: string;
    size: number;
    category: 'image' | 'video' | 'document' | 'other';
}

export interface FileMetadata {
    filename: string;
    mimeType: string;
    size: number;
    category: 'image' | 'video' | 'document' | 'other';
}

/**
 * Get file category based on MIME type
 */
export function getFileCategory(mimeType: string): 'image' | 'video' | 'document' | 'other' {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('text/') ||
        mimeType.includes('pdf') ||
        mimeType.includes('document') ||
        mimeType.includes('spreadsheet') ||
        mimeType.includes('presentation')) return 'document';
    return 'other';
}

/**
 * Get appropriate icon for file category
 */
export function getFileIcon(category: 'image' | 'video' | 'document' | 'other') {
    switch (category) {
        case 'image': return Image;
        case 'video': return Video;
        case 'document': return FileText;
        default: return File;
    }
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Validate file for upload
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
    // Check file size (max 100MB for videos, 50MB for others)
    const maxSize = file.type.startsWith('video/') ? 100 * 1024 * 1024 : 50 * 1024 * 1024;
    if (file.size > maxSize) {
        return {
            valid: false,
            error: `File size must be less than ${formatFileSize(maxSize)}`
        };
    }

    // Check for empty file
    if (file.size === 0) {
        return {
            valid: false,
            error: 'File is empty'
        };
    }

    return { valid: true };
}

/**
 * Upload file to Walrus storage
 */
export async function uploadFileToWalrus(
    file: File,
    storage: WalrusStorageAdapter,
    epochs: number = 5
): Promise<FileUploadResult> {
    const validation = validateFile(file);
    if (!validation.valid) {
        throw new Error(validation.error);
    }

    try {
        console.log('[WalrusService] Starting file upload:', {
            name: file.name,
            type: file.type,
            size: file.size
        });

        // Convert file to Uint8Array
        const arrayBuffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);

        // Upload to Walrus
        const uploadResult = await storage.upload([uint8Array], { epochs });

        console.log('[WalrusService] Upload result:', uploadResult);

        // Extract blob ID from upload result
        let blobId: string | undefined;

        if (typeof uploadResult === 'object' && uploadResult !== null) {
            // Try different possible property names for blob ID
            if ('ids' in uploadResult && Array.isArray(uploadResult.ids) && uploadResult.ids.length > 0) {
                blobId = uploadResult.ids[0] as string;
            } else if ('blobId' in uploadResult) {
                blobId = uploadResult.blobId as string;
            } else if ('id' in uploadResult) {
                blobId = uploadResult.id as string;
            } else if ('blob_id' in uploadResult) {
                blobId = uploadResult.blob_id as string;
            }
        }

        if (!blobId) {
            throw new Error('Failed to extract blob ID from upload result');
        }

        const category = getFileCategory(file.type);

        console.log('[WalrusService] File uploaded successfully:', {
            blobId,
            filename: file.name,
            category
        });

        return {
            blobId,
            filename: file.name,
            mimeType: file.type,
            size: file.size,
            category
        };
    } catch (error) {
        console.error('[WalrusService] Upload failed:', error);
        throw error;
    }
}

/**
 * Create fallback file storage in localStorage
 */
export async function createFallbackFile(file: File): Promise<string> {
    const tempBlobId = `temp_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    const arrayBuffer = await file.arrayBuffer();
    const fileData = {
        name: file.name,
        type: file.type,
        size: file.size,
        data: Array.from(new Uint8Array(arrayBuffer)),
        timestamp: Date.now(),
    };

    localStorage.setItem(`walrus_temp_${tempBlobId}`, JSON.stringify(fileData));
    console.log('[WalrusService] File stored locally with temp ID:', tempBlobId);

    return tempBlobId;
}

/**
 * Get file metadata from file
 */
export function getFileMetadata(file: File): FileMetadata {
    return {
        filename: file.name,
        mimeType: file.type,
        size: file.size,
        category: getFileCategory(file.type)
    };
}

/**
 * Format file reference for message content
 */
export function formatFileReference(result: FileUploadResult): string {
    return `[FILE:${result.category}|${result.blobId}|${result.filename}]`;
}

/**
 * Parse file reference from message content
 */
export function parseFileReference(content: string): {
    type: 'legacy' | 'new';
    category?: 'image' | 'video' | 'document' | 'other';
    blobId: string;
    filename?: string;
} | null {
    // New format: [category:blobId] (shorter format)
    const newFormatMatch = content.match(/\[(image|video|document|other):([^\]]+)\]/);
    if (newFormatMatch) {
        return {
            type: 'new',
            category: newFormatMatch[1] as 'image' | 'video' | 'document' | 'other',
            blobId: newFormatMatch[2]
        };
    }

    // Legacy format: [IMAGE:blobId]
    const legacyFormatMatch = content.match(/\[IMAGE:([^\]]+)\]/);
    if (legacyFormatMatch) {
        return {
            type: 'legacy',
            blobId: legacyFormatMatch[1]
        };
    }

    return null;
}

/**
 * Get file URL from Walrus aggregators
 */
export async function getFileUrl(blobId: string): Promise<string> {
    // Try Walruscan testnet first (the real explorer)
    try {
        console.log(`[WalrusService] Fetching file from Walruscan: ${blobId}`);

        // Try Walruscan testnet blob URL
        const walruscanUrl = `https://walruscan.com/testnet/blob/${blobId}`;
        const response = await fetch(walruscanUrl, { method: 'HEAD' });

        if (response.ok) {
            console.log(`[WalrusService] File found on Walruscan: ${walruscanUrl}`);
            return walruscanUrl;
        }
    } catch (error) {
        console.warn(`[WalrusService] Walruscan failed:`, error);
    }

    // Fallback to official Walrus testnet aggregators
    const aggregators = [
        'https://aggregator.testnet.walrus.mirai.cloud/v1',
        'https://aggregator.walrus-testnet.walrus.space/v1'
    ];

    for (const baseUrl of aggregators) {
        try {
            const url = `${baseUrl}/${blobId}`;
            const response = await fetch(url, { method: 'HEAD' });
            if (response.ok) {
                console.log(`[WalrusService] File found on aggregator: ${url}`);
                return url;
            }
        } catch (error) {
            console.warn(`[WalrusService] Failed to check aggregator ${baseUrl}:`, error);
        }
    }

    // Last resort: return Walruscan URL (let browser handle it)
    const fallbackUrl = `https://walruscan.com/testnet/blob/${blobId}`;
    console.log(`[WalrusService] Using Walruscan fallback: ${fallbackUrl}`);
    return fallbackUrl;
}

/**
 * Store file in localStorage fallback
 */
export function storeFallbackFile(blobId: string, file: File, url: string, messageContent?: string): void {
    const metadata: FileMetadata = {
        category: getFileCategory(file.type),
        filename: file.name,
        size: file.size,
        mimeType: file.type,
    };

    const fallbackData = {
        url,
        metadata,
        uploadedAt: Date.now(),
        messageContent: messageContent || 'Uploaded via messaging app',
    };

    localStorage.setItem(`walrus_fallback_${blobId}`, JSON.stringify(fallbackData));
}

/**
 * Get file from localStorage fallback
 */
export function getFallbackFile(blobId: string): { url: string; metadata: FileMetadata } | null {
    const storageKey = `walrus_temp_${blobId}`;
    const storedData = localStorage.getItem(storageKey);

    if (!storedData) {
        return null;
    }

    try {
        const fileData = JSON.parse(storedData);
        const uint8Array = new Uint8Array(fileData.data);
        const blob = new Blob([uint8Array], { type: fileData.type });
        const url = URL.createObjectURL(blob);

        return {
            url,
            metadata: {
                filename: fileData.name,
                mimeType: fileData.type,
                size: fileData.size,
                category: getFileCategory(fileData.type)
            }
        };
    } catch (error) {
        console.error('[WalrusService] Failed to load fallback file:', error);
        return null;
    }
}
