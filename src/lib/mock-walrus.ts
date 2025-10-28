// Mock Walrus service for testing without mainnet
export class MockWalrusStorageAdapter {
  private mockFiles = new Map<string, { data: Uint8Array; metadata: any }>();

  async upload(data: Uint8Array[], options?: { epochs?: number }): Promise<{ ids: string[] }> {
    // Generate a mock blob ID
    const blobId = `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Store the file data
    this.mockFiles.set(blobId, {
      data: data[0],
      metadata: {
        epochs: options?.epochs || 10,
        uploadedAt: Date.now()
      }
    });

    console.log(`[MockWalrus] Uploaded file with ID: ${blobId}`);
    
    return { ids: [blobId] };
  }

  async getFile(blobId: string): Promise<Uint8Array | null> {
    const file = this.mockFiles.get(blobId);
    return file ? file.data : null;
  }

  // Get a mock URL for the file
  getMockUrl(blobId: string): string {
    return `data:image/jpeg;base64,${this.encodeToBase64(blobId)}`;
  }

  private encodeToBase64(blobId: string): string {
    // Create a simple mock image data
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // Create a gradient background
      const gradient = ctx.createLinearGradient(0, 0, 200, 200);
      gradient.addColorStop(0, '#ff6b6b');
      gradient.addColorStop(1, '#4ecdc4');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 200, 200);
      
      // Add text
      ctx.fillStyle = 'white';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Mock Image', 100, 100);
      ctx.fillText(blobId.substring(0, 8), 100, 120);
    }
    
    return canvas.toDataURL('image/jpeg').split(',')[1];
  }
}

// Mock file URL function
export async function getMockFileUrl(blobId: string): Promise<string> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
  
  // Return a mock URL
  return `data:image/jpeg;base64,${btoa(`Mock image data for ${blobId}`)}`;
}

// Mock the real Walrus service
export function createMockWalrusService() {
  const mockStorage = new MockWalrusStorageAdapter();
  
  return {
    storage: mockStorage,
    getFileUrl: getMockFileUrl
  };
}
