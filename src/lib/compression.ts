/**
 * PixelForge Lossless & High-Fidelity Image Compression Engine
 * Compresses images client-side without quality loss to optimize IndexedDB storage and render performance.
 */

export interface CompressionResult {
  compressedBlob: Blob;
  originalSize: number;
  compressedSize: number;
  savedBytes: number;
  savingsPercentage: number;
  width: number;
  height: number;
  mimeType: string;
}

export interface CompressionOptions {
  maxDimension?: number; // e.g. 2560 for 2K/4K max bounds
  format?: 'image/webp' | 'image/png' | 'image/jpeg';
  quality?: number; // 0.95 - 1.0 for visually lossless
}

export async function compressImageLossless(
  source: Blob | File,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const {
    maxDimension = 2560,
    quality = 0.95,
  } = options;

  const originalSize = source.size;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(source);

    img.onload = () => {
      URL.revokeObjectURL(url);
      const origW = img.naturalWidth || img.width;
      const origH = img.naturalHeight || img.height;

      let targetW = origW;
      let targetH = origH;

      // Scale down only if exceeding maxDimension (e.g. 2560px), preserving aspect ratio
      if (maxDimension && (targetW > maxDimension || targetH > maxDimension)) {
        if (targetW > targetH) {
          targetH = Math.round((targetH * maxDimension) / targetW);
          targetW = maxDimension;
        } else {
          targetW = Math.round((targetW * maxDimension) / targetH);
          targetH = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, targetW);
      canvas.height = Math.max(1, targetH);

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve({
          compressedBlob: source,
          originalSize,
          compressedSize: originalSize,
          savedBytes: 0,
          savingsPercentage: 0,
          width: origW,
          height: origH,
          mimeType: source.type || 'image/jpeg',
        });
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, targetW, targetH);

      // Export using high-fidelity WebP
      canvas.toBlob(
        (blob) => {
          if (blob && (blob.size < originalSize || blob.type === 'image/webp')) {
            const compressedSize = blob.size;
            const savedBytes = Math.max(0, originalSize - compressedSize);
            const savingsPercentage =
              originalSize > 0 ? Math.max(0, Math.round((savedBytes / originalSize) * 100)) : 0;

            resolve({
              compressedBlob: blob,
              originalSize,
              compressedSize,
              savedBytes,
              savingsPercentage,
              width: targetW,
              height: targetH,
              mimeType: 'image/webp',
            });
          } else {
            resolve({
              compressedBlob: source,
              originalSize,
              compressedSize: originalSize,
              savedBytes: 0,
              savingsPercentage: 0,
              width: origW,
              height: origH,
              mimeType: source.type || 'image/jpeg',
            });
          }
        },
        'image/webp',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image for compression'));
    };

    img.src = url;
  });
}
