import {
  detectFaceWithDescriptor,
  compareFaceDescriptors,
  drawFaceDetectionOverlay,
  loadFaceApiModels,
  DetectedFaceResult
} from "./faceApiEngine";

export {
  detectFaceWithDescriptor,
  compareFaceDescriptors,
  drawFaceDetectionOverlay,
  loadFaceApiModels
};

export type { DetectedFaceResult };

/**
 * Extract 128-dimensional Neural Network Face Embedding Vector from Canvas
 */
export async function extractFaceDescriptorAsync(
  canvas: HTMLCanvasElement | HTMLVideoElement | HTMLImageElement
): Promise<number[] | null> {
  const result = await detectFaceWithDescriptor(canvas);
  if (!result) return null;
  return Array.from(result.descriptor);
}

/**
 * Calculate Euclidean Distance between two 128-D face descriptors
 */
export function calculateFaceDistance(
  desc1: number[] | Float32Array,
  desc2: number[] | Float32Array
): number {
  return compareFaceDescriptors(desc1, desc2);
}

// Synchronous fallback wrapper for legacy calls
export function extractFaceDescriptor(canvas: HTMLCanvasElement): number[] {
  // If sync call made, extract normalized grayscale feature representation
  const ctx = canvas.getContext("2d");
  if (!ctx) return new Array(128).fill(0);

  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = 32;
  tempCanvas.height = 32;
  const tempCtx = tempCanvas.getContext("2d");
  if (!tempCtx) return new Array(128).fill(0);

  tempCtx.drawImage(canvas, 0, 0, 32, 32);
  const imgData = tempCtx.getImageData(0, 0, 32, 32);
  const pixels = imgData.data;

  const grayscale = new Float32Array(32 * 32);
  let totalSum = 0;
  for (let i = 0; i < 1024; i++) {
    const val = (0.299 * pixels[i * 4] + 0.587 * pixels[i * 4 + 1] + 0.114 * pixels[i * 4 + 2]) / 255.0;
    grayscale[i] = val;
    totalSum += val;
  }
  const meanVal = totalSum / 1024;

  const descriptor: number[] = [];
  for (let cy = 0; cy < 8; cy++) {
    for (let cx = 0; cx < 8; cx++) {
      let gradSum = 0;
      for (let y = cy * 4; y < (cy + 1) * 4; y++) {
        for (let x = cx * 4; x < (cx + 1) * 4 - 1; x++) {
          const idx = y * 32 + x;
          gradSum += (grayscale[idx + 1] - meanVal) - (grayscale[idx] - meanVal);
        }
      }
      descriptor.push(gradSum / 16);
    }
  }

  // 128-D vector
  while (descriptor.length < 128) {
    descriptor.push(0);
  }

  let sumSq = 0;
  for (let i = 0; i < 128; i++) sumSq += descriptor[i] * descriptor[i];
  const norm = Math.sqrt(sumSq) || 1;
  return descriptor.map(v => v / norm);
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}
