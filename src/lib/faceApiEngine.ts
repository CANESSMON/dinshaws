let faceapiInstance: typeof import("@vladmandic/face-api") | null = null;
let isModelLoaded = false;
let modelLoadingPromise: Promise<void> | null = null;

export async function getFaceApi() {
  if (typeof window === "undefined") return null;
  if (!faceapiInstance) {
    faceapiInstance = await import("@vladmandic/face-api");
  }
  return faceapiInstance;
}

/**
 * Load face-api neural network models from local public/models directory
 */
export async function loadFaceApiModels(): Promise<void> {
  if (typeof window === "undefined") return;
  if (isModelLoaded) return;
  if (modelLoadingPromise) return modelLoadingPromise;

  modelLoadingPromise = (async () => {
    try {
      const faceapi = await getFaceApi();
      if (!faceapi) return;

      const MODEL_URL = "/models";
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)
      ]);
      isModelLoaded = true;
      console.log("FaceAPI Neural Network Models loaded successfully from /models");
    } catch (err) {
      console.error("Failed to load FaceAPI models:", err);
      modelLoadingPromise = null;
      throw err;
    }
  })();

  return modelLoadingPromise;
}

export interface DetectedFaceResult {
  detection: any;
  landmarks: any;
  descriptor: Float32Array;
  expressions?: any;
}

/**
 * Detect a single face with landmarks, 128-D ResNet embedding descriptor, and facial expressions
 */
export async function detectFaceWithDescriptor(
  input: HTMLVideoElement | HTMLCanvasElement | HTMLImageElement
): Promise<DetectedFaceResult | null> {
  if (typeof window === "undefined") return null;

  const faceapi = await getFaceApi();
  if (!faceapi) return null;

  await loadFaceApiModels();

  const options = new faceapi.TinyFaceDetectorOptions({
    inputSize: 320,
    scoreThreshold: 0.5
  });

  const result = await faceapi
    .detectSingleFace(input, options)
    .withFaceLandmarks(true)
    .withFaceDescriptor()
    .withFaceExpressions();

  if (!result) return null;

  return {
    detection: result.detection,
    landmarks: result.landmarks,
    descriptor: result.descriptor,
    expressions: result.expressions
  };
}

/**
 * Calculate Euclidean Distance between two 128-D face embedding descriptors
 */
export function compareFaceDescriptors(
  descriptor1: number[] | Float32Array,
  descriptor2: number[] | Float32Array
): number {
  if (!descriptor1 || !descriptor2) return 2.0;

  const len = Math.min(descriptor1.length, descriptor2.length);
  let sum = 0;
  for (let i = 0; i < len; i++) {
    const diff = descriptor1[i] - descriptor2[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

/**
 * Draw face detection box & landmark alignment points on canvas
 */
export function drawFaceDetectionOverlay(
  canvas: HTMLCanvasElement,
  displaySize: { width: number; height: number },
  detectionResult: DetectedFaceResult | null,
  isMatchSuccess: boolean,
  matchedName?: string
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.clearRect(0, 0, displaySize.width, displaySize.height);

  if (!detectionResult) return;

  const imgW = detectionResult.detection.imageWidth || displaySize.width;
  const imgH = detectionResult.detection.imageHeight || displaySize.height;
  const scaleX = displaySize.width / imgW;
  const scaleY = displaySize.height / imgH;

  const box = {
    x: detectionResult.detection.box.x * scaleX,
    y: detectionResult.detection.box.y * scaleY,
    width: detectionResult.detection.box.width * scaleX,
    height: detectionResult.detection.box.height * scaleY
  };

  const color = isMatchSuccess ? "#22c55e" : "#00f3ff";

  // Draw face box
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.shadowColor = color;
  ctx.shadowBlur = 8;
  ctx.strokeRect(box.x, box.y, box.width, box.height);

  // Corner brackets
  const bracketLen = Math.min(20, box.width / 4);
  ctx.lineWidth = 4;

  // Top-Left
  ctx.beginPath();
  ctx.moveTo(box.x, box.y + bracketLen);
  ctx.lineTo(box.x, box.y);
  ctx.lineTo(box.x + bracketLen, box.y);
  ctx.stroke();

  // Top-Right
  ctx.beginPath();
  ctx.moveTo(box.x + box.width - bracketLen, box.y);
  ctx.lineTo(box.x + box.width, box.y);
  ctx.lineTo(box.x + box.width, box.y + bracketLen);
  ctx.stroke();

  // Bottom-Left
  ctx.beginPath();
  ctx.moveTo(box.x, box.y + box.height - bracketLen);
  ctx.lineTo(box.x, box.y + box.height);
  ctx.lineTo(box.x + bracketLen, box.y + box.height);
  ctx.stroke();

  // Bottom-Right
  ctx.beginPath();
  ctx.moveTo(box.x + box.width - bracketLen, box.y + box.height);
  ctx.lineTo(box.x + box.width, box.y + box.height);
  ctx.lineTo(box.x + box.width, box.y + box.height - bracketLen);
  ctx.stroke();

  // Draw landmark points (eyes, nose, mouth)
  const landmarks = detectionResult.landmarks.positions;
  ctx.fillStyle = isMatchSuccess ? "rgba(34, 197, 94, 0.7)" : "rgba(0, 243, 255, 0.7)";
  ctx.shadowBlur = 0;

  for (const pt of landmarks) {
    ctx.beginPath();
    ctx.arc(pt.x * scaleX, pt.y * scaleY, 2, 0, 2 * Math.PI);
    ctx.fill();
  }

  // Draw label above box
  ctx.fillStyle = color;
  ctx.font = "bold 13px sans-serif";
  const labelText = isMatchSuccess
    ? `VERIFIED: ${matchedName || "MATCH"}`
    : `FACE DETECTED (${Math.round(detectionResult.detection.score * 100)}%)`;
  ctx.fillText(labelText, box.x + 4, Math.max(18, box.y - 10));
}
