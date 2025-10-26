import { WalrusStorageAdapter } from '@mysten/messaging';
import { Video, FileText, File, Image } from 'lucide-react';

// Walrus HTTP API Configuration - Using official testnet endpoints from docs.wal.app
const WALRUS_TESTNET_AGGREGATORS = [
    'https://aggregator.walrus-testnet.walrus.space',
    'https://aggregator.testnet.walrus.mirai.cloud',
    'https://aggregator.walrus-testnet.h2o-nodes.com',
    'https://wal-aggregator-testnet.staketab.org',
    'https://walrus-testnet-aggregator.nodes.guru'
];

const WALRUS_TESTNET_PUBLISHERS = [
    'https://publisher.walrus-testnet.walrus.space',
    'https://publisher.testnet.walrus.atalma.io',
    'https://publisher.walrus-testnet.h2o-nodes.com',
    'https://wal-publisher-testnet.staketab.org',
    'https://walrus-testnet-publisher.nodes.guru'
];

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
 * Upload file to Walrus using HTTP API
 * Based on official docs: https://docs.wal.app/usage/web-api.html
 */
export async function uploadFileToWalrusHTTP(
    file: File,
    epochs: number = 10
): Promise<FileUploadResult> {
    const validation = validateFile(file);
    if (!validation.valid) {
        throw new Error(validation.error);
    }

    console.log('[WalrusService] Starting HTTP API file upload:', {
        name: file.name,
        type: file.type,
        size: file.size,
        epochs
    });

    let lastError: Error | null = null;

    // Try each publisher in sequence
    for (const publisherBaseUrl of WALRUS_TESTNET_PUBLISHERS) {
        try {
            // Use deletable=true as per docs (default since v1.33)
            const url = `${publisherBaseUrl}/v1/blobs?epochs=${epochs}`;
            console.log(`[WalrusService] Uploading to publisher: ${url}`);

            const response = await fetch(url, {
                method: 'PUT',
                body: file,
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.warn(`[WalrusService] Publisher ${publisherBaseUrl} returned ${response.status}: ${errorText}`);
                lastError = new Error(`HTTP ${response.status}: ${errorText}`);
                continue;
            }

            const result = await response.json();
            console.log('[WalrusService] Upload response:', JSON.stringify(result, null, 2));

            // Extract blob ID from response according to Walrus API spec
            let blobId: string | undefined;

            // Check for newlyCreated response
            if (result.newlyCreated?.blobObject?.blobId) {
                blobId = result.newlyCreated.blobObject.blobId;
                console.log('[WalrusService] Blob newly created with ID:', blobId);
            }
            // Check for alreadyCertified response
            else if (result.alreadyCertified?.blobId) {
                blobId = result.alreadyCertified.blobId;
                console.log('[WalrusService] Blob already certified with ID:', blobId);
            }
            // Check for direct blobId field (some publishers may use this)
            else if (result.blobId) {
                blobId = result.blobId;
                console.log('[WalrusService] Blob ID from direct field:', blobId);
            }

            if (!blobId) {
                console.error('[WalrusService] Could not extract blob ID from response:', result);
                lastError = new Error('Failed to extract blob ID from upload response');
                continue;
            }

            const category = getFileCategory(file.type);

            console.log('[WalrusService] ✅ File uploaded successfully:', {
                blobId,
                filename: file.name,
                category,
                publisher: publisherBaseUrl
            });

            return {
                blobId,
                filename: file.name,
                mimeType: file.type,
                size: file.size,
                category
            };
        } catch (error) {
            console.warn(`[WalrusService] Failed to upload to publisher ${publisherBaseUrl}:`, error);
            lastError = error instanceof Error ? error : new Error(String(error));
        }
    }

    // If all publishers fail, throw the last error
    throw new Error(`Failed to upload file "${file.name}" to any Walrus publisher. Last error: ${lastError?.message || 'Unknown error'}`);
}

/**
 * Upload file to Walrus storage (SDK method - kept as fallback)
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
        console.log('[WalrusService] Starting SDK file upload:', {
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
 * Get file URL from Walrus aggregators using HTTP API
 * Based on official docs: https://docs.wal.app/usage/web-api.html
 */
export async function getFileUrl(blobId: string): Promise<string> {
    console.log(`[WalrusService] Fetching blob: ${blobId}`);

    let lastError: Error | null = null;

    // Try each aggregator in sequence
    for (const aggregatorBaseUrl of WALRUS_TESTNET_AGGREGATORS) {
        try {
            const url = `${aggregatorBaseUrl}/v1/blobs/${blobId}`;
            console.log(`[WalrusService] Trying aggregator: ${url}`);

            const response = await fetch(url, { method: 'HEAD' });

            if (response.ok) {
                console.log(`[WalrusService] ✅ Blob found at: ${url}`);
                return url;
            } else if (response.status === 400) {
                // 400 means blob doesn't exist or is malformed - no point retrying
                console.warn(`[WalrusService] Blob not found (400) on ${aggregatorBaseUrl}`);
                lastError = new Error(`Blob ${blobId} not found (400 Bad Request)`);
                break; // Don't try other aggregators for 400 errors
            } else if (response.status === 404) {
                console.warn(`[WalrusService] Blob not found (404) on ${aggregatorBaseUrl}`);
                lastError = new Error(`Blob ${blobId} not found (404 Not Found)`);
                continue; // Try next aggregator
            } else {
                console.warn(`[WalrusService] Aggregator returned ${response.status}`);
                lastError = new Error(`HTTP ${response.status}`);
            }
        } catch (error) {
            console.warn(`[WalrusService] Error checking ${aggregatorBaseUrl}:`, error);
            lastError = error instanceof Error ? error : new Error(String(error));
        }
    }

    throw new Error(`Blob ${blobId} not available on any aggregator. ${lastError?.message || ''}`);
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
