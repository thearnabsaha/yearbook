import { YearbookAlignment, YearbookAspectRatio, DEFAULT_ALIGNMENT } from './types';

interface DetectedFaceLandmarks {
  faceX: number; // 0 to 1
  faceY: number; // 0 to 1
  faceWidth: number; // 0 to 1
  faceHeight: number; // 0 to 1
  leftEye?: { x: number; y: number }; // 0 to 1
  rightEye?: { x: number; y: number }; // 0 to 1
  confidence: number;
}

// Check if browser has native FaceDetector API
declare global {
  interface Window {
    FaceDetector?: new (options?: {
      maxDetectedFaces?: number;
      fastMode?: boolean;
    }) => {
      detect: (
        image: ImageBitmapSource
      ) => Promise<
        Array<{
          boundingBox: DOMRectReadOnly;
          landmarks?: Array<{
            type: 'eye' | 'mouth' | 'nose';
            locations: Array<{ x: number; y: number }>;
          }>;
        }>
      >;
    };
  }
}

// Computer vision skin & eye detector for offscreen canvas analysis
function analyzeFaceWithCanvas(img: HTMLImageElement): DetectedFaceLandmarks | null {
  const analysisSize = 320;
  const canvas = document.createElement('canvas');
  canvas.width = analysisSize;
  canvas.height = Math.round((img.naturalHeight / img.naturalWidth) * analysisSize);
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;

  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // 1. Skin-tone pixel mapping (YCbCr thresholding)
  let minX = canvas.width;
  let maxX = 0;
  let minY = canvas.height;
  let maxY = 0;
  let skinPixelCount = 0;

  // Center-weighted bias array
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;

  let weightedX = 0;
  let weightedY = 0;

  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const idx = (y * canvas.width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      // YCbCr skin tone formula
      const Y = 0.299 * r + 0.587 * g + 0.114 * b;
      const Cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
      const Cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;

      // Skin threshold
      if (Cr >= 133 && Cr <= 173 && Cb >= 77 && Cb <= 127 && Y >= 60) {
        // Exclude extreme corners
        const distFromCenter = Math.hypot(x - centerX, y - centerY);
        if (distFromCenter < canvas.width * 0.48) {
          skinPixelCount++;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;

          weightedX += x;
          weightedY += y;
        }
      }
    }
  }

  if (skinPixelCount < 500) {
    // If not enough skin pixels detected, assume centered face fallback
    return {
      faceX: 0.5,
      faceY: 0.42,
      faceWidth: 0.45,
      faceHeight: 0.5,
      leftEye: { x: 0.42, y: 0.38 },
      rightEye: { x: 0.58, y: 0.38 },
      confidence: 0.5,
    };
  }

  const faceCenterNormX = weightedX / skinPixelCount / canvas.width;
  const faceCenterNormY = weightedY / skinPixelCount / canvas.height;
  const faceWidthNorm = Math.max(0.2, (maxX - minX) / canvas.width);
  const faceHeightNorm = Math.max(0.25, (maxY - minY) / canvas.height);

  // Approximate eye coordinates in upper third of detected face region
  const eyeLevelY = Math.max(0.15, faceCenterNormY - faceHeightNorm * 0.12);
  const leftEyeX = Math.max(0.1, faceCenterNormX - faceWidthNorm * 0.22);
  const rightEyeX = Math.min(0.9, faceCenterNormX + faceWidthNorm * 0.22);

  return {
    faceX: faceCenterNormX,
    faceY: faceCenterNormY,
    faceWidth: faceWidthNorm,
    faceHeight: faceHeightNorm,
    leftEye: { x: leftEyeX, y: eyeLevelY },
    rightEye: { x: rightEyeX, y: eyeLevelY },
    confidence: 0.85,
  };
}

// Main auto-alignment function
export async function detectAndAutoAlignFace(
  img: HTMLImageElement,
  aspectRatio: YearbookAspectRatio = '9:16'
): Promise<YearbookAlignment> {
  const origW = img.naturalWidth || 1080;
  const origH = img.naturalHeight || 1920;

  // Standard target eye level and eye distance targets
  // In 9:16, standard eye level is 38% from top
  // In 1:1, standard eye level is 40% from top
  const targetEyeYPercent = aspectRatio === '1:1' ? 40 : 38;
  const targetEyeDistPercent = aspectRatio === '1:1' ? 26 : 24;

  let landmarks: DetectedFaceLandmarks | null = null;

  // 1. Try Native Browser FaceDetector if available
  if (typeof window !== 'undefined' && window.FaceDetector) {
    try {
      const detector = new window.FaceDetector({ maxDetectedFaces: 1, fastMode: true });
      const faces = await detector.detect(img);
      if (faces && faces.length > 0) {
        const f = faces[0];
        const box = f.boundingBox;

        let leftEyeLoc: { x: number; y: number } | undefined;
        let rightEyeLoc: { x: number; y: number } | undefined;

        if (f.landmarks) {
          const eyes = f.landmarks.filter((l) => l.type === 'eye');
          if (eyes.length >= 2) {
            const e1 = eyes[0].locations[0];
            const e2 = eyes[1].locations[0];
            if (e1.x < e2.x) {
              leftEyeLoc = { x: e1.x / origW, y: e1.y / origH };
              rightEyeLoc = { x: e2.x / origW, y: e2.y / origH };
            } else {
              leftEyeLoc = { x: e2.x / origW, y: e2.y / origH };
              rightEyeLoc = { x: e1.x / origW, y: e1.y / origH };
            }
          }
        }

        landmarks = {
          faceX: (box.x + box.width / 2) / origW,
          faceY: (box.y + box.height / 2) / origH,
          faceWidth: box.width / origW,
          faceHeight: box.height / origH,
          leftEye: leftEyeLoc,
          rightEye: rightEyeLoc,
          confidence: 0.95,
        };
      }
    } catch (err) {
      console.warn('Native FaceDetector error, falling back to canvas CV:', err);
    }
  }

  // 2. Fallback to Canvas Computer Vision
  if (!landmarks) {
    landmarks = analyzeFaceWithCanvas(img);
  }

  if (!landmarks) {
    return DEFAULT_ALIGNMENT;
  }

  // Calculate eye center and eye distance
  let eyeCenterX = landmarks.faceX;
  let eyeCenterY = landmarks.faceY - landmarks.faceHeight * 0.1;
  let eyeDistance = landmarks.faceWidth * 0.44;

  if (landmarks.leftEye && landmarks.rightEye) {
    eyeCenterX = (landmarks.leftEye.x + landmarks.rightEye.x) / 2;
    eyeCenterY = (landmarks.leftEye.y + landmarks.rightEye.y) / 2;
    eyeDistance = Math.hypot(
      landmarks.rightEye.x - landmarks.leftEye.x,
      landmarks.rightEye.y - landmarks.leftEye.y
    );
  }

  // Calculate scale factor: we want the eyes distance to match targetEyeDistPercent
  const currentEyeDistPercent = eyeDistance * 100;
  let optimalScale = 1.0;

  if (currentEyeDistPercent > 0) {
    optimalScale = parseFloat((targetEyeDistPercent / currentEyeDistPercent).toFixed(2));
    // Clamp to reasonable zoom limits
    optimalScale = Math.max(0.75, Math.min(1.85, optimalScale));
  }

  // Calculate offsets to center the eyes at 50% X and targetEyeYPercent Y
  const currentEyeXPercent = eyeCenterX * 100;
  const currentEyeYPercent = eyeCenterY * 100;

  // Offset shifts needed
  const rawOffsetX = (50 - currentEyeXPercent) * optimalScale;
  const rawOffsetY = (targetEyeYPercent - currentEyeYPercent) * optimalScale;

  const offsetX = Math.max(-45, Math.min(45, Math.round(rawOffsetX)));
  const offsetY = Math.max(-45, Math.min(45, Math.round(rawOffsetY)));

  return {
    offsetX,
    offsetY,
    scale: optimalScale,
    rotation: 0,
  };
}
