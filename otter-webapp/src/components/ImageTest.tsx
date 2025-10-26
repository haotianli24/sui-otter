import React, { useState } from 'react';
import { Button } from './ui/button';
import { getFileUrl } from '../lib/walrus-service';

export function ImageTest() {
    const [blobId, setBlobId] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const testImageLoad = async () => {
        if (!blobId.trim()) return;

        setLoading(true);
        setError('');

        try {
            const url = await getFileUrl(blobId);
            setImageUrl(url);
            console.log('Image URL:', url);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load image');
            console.error('Error loading image:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 border rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Test Image Loading (Mainnet)</h3>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-2">
                        Blob ID (paste from console logs):
                    </label>
                    <input
                        type="text"
                        value={blobId}
                        onChange={(e) => setBlobId(e.target.value)}
                        placeholder="e.g., njII_YeOBDqA_IVZipyT1XZmCf1v1H4J3RDFCHQDBhMBAQAJAg"
                        className="w-full p-2 border rounded"
                    />
                </div>

                <Button onClick={testImageLoad} disabled={loading || !blobId.trim()}>
                    {loading ? 'Loading...' : 'Test Load Image'}
                </Button>

                {error && (
                    <div className="text-red-500 text-sm">
                        Error: {error}
                    </div>
                )}

                {imageUrl && (
                    <div>
                        <p className="text-sm text-green-600 mb-2">Image loaded successfully!</p>
                        <img
                            src={imageUrl}
                            alt="Test image"
                            className="max-w-xs max-h-64 object-contain border rounded"
                            onError={(e) => {
                                console.error('Image failed to load:', e);
                                setError('Image failed to display (URL may be invalid)');
                            }}
                        />
                        <p className="text-xs text-gray-500 mt-2">URL: {imageUrl}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
