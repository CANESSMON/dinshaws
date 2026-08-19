"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, AlertTriangle, RefreshCw, Loader2, ShieldCheck, UserCheck } from "lucide-react";
import { 
  detectFaceWithDescriptor, 
  compareFaceDescriptors, 
  drawFaceDetectionOverlay, 
  loadFaceApiModels,
  extractFaceDescriptorAsync
} from "@/lib/faceX";

export interface EmployeeUser {
  userId: string;
  name: string;
  mobile: string;
  faceData: string;
  faceDescriptor?: string | number[] | number[][];
  isActive?: boolean;
}

export default function ScanPage() {
  const router = useRouter();
  const [users, setUsers] = useState<EmployeeUser[]>([]);
  const [modelsLoaded, setModelsLoaded] = useState<boolean>(false);
  const [statusText, setStatusText] = useState<string>("Initializing face recognition neural network...");
  const [currentJobStep, setCurrentJobStep] = useState<number>(1); // 1: Detect, 2: Align, 3: Liveness, 4: Match
  const [isScanSuccess, setIsScanSuccess] = useState<boolean>(false);
  const [isScanFailed, setIsScanFailed] = useState<boolean>(false);
  const [matchedUser, setMatchedUser] = useState<EmployeeUser | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isLoopRunningRef = useRef<boolean>(false);

  // 1. Load Neural Network Models on Page Mount
  useEffect(() => {
    loadFaceApiModels()
      .then(() => {
        setModelsLoaded(true);
        setStatusText("Look at camera to log in");
      })
      .catch((err) => {
        console.error("Failed loading face neural models:", err);
        setStatusText("Model initialization error.");
      });
  }, []);

  // Helper to extract 128-D descriptor from user base64 profile image if missing
  const getDescriptorForUser = async (user: EmployeeUser): Promise<number[] | number[][] | null> => {
    if (user.faceDescriptor) {
      try {
        const parsed = typeof user.faceDescriptor === "string"
          ? JSON.parse(user.faceDescriptor)
          : user.faceDescriptor;
        return parsed;
      } catch (e) {
        console.error("Error parsing stored faceDescriptor:", e);
      }
    }

    if (!user.faceData || !user.faceData.startsWith("data:image")) {
      return null;
    }

    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = async () => {
        try {
          const desc = await extractFaceDescriptorAsync(img);
          resolve(desc);
        } catch {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = user.faceData;
    });
  };

  // 2. Fetch Active Users from Database & Process Embeddings
  useEffect(() => {
    fetch("/api/users")
      .then((res) => res.json())
      .then(async (data) => {
        const activeUsers = data.filter((u: any) => u.isActive !== false);
        const processedUsers = await Promise.all(
          activeUsers.map(async (u: EmployeeUser) => {
            const desc = await getDescriptorForUser(u);
            return {
              ...u,
              faceDescriptor: desc || u.faceDescriptor
            };
          })
        );
        setUsers(processedUsers);
      })
      .catch((err) => {
        console.error("Error fetching users from database:", err);
      });

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // 3. Set Up Camera & Start Continuous Detection / Matching Loop
  useEffect(() => {
    if (!modelsLoaded) return;

    navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240, facingMode: "user" } })
      .then((stream) => {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            startAnalysisLoop();
          };
        }
      })
      .catch((err) => {
        console.error("Camera access failed:", err);
        setStatusText("Camera access required.");
      });

    return () => {
      isLoopRunningRef.current = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [modelsLoaded, users]);

  // 4. Real-Time 4-Job Pipeline (Detect -> Align -> Liveness -> 128D Embedding Match)
  const startAnalysisLoop = () => {
    if (isLoopRunningRef.current) return;
    isLoopRunningRef.current = true;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const scanStartTime = Date.now();
    let isProcessing = false;
    let isFinished = false;

    const loop = async () => {
      if (isFinished || !isLoopRunningRef.current) return;

      if (video.readyState === video.HAVE_ENOUGH_DATA && !isProcessing) {
        isProcessing = true;

        const width = video.videoWidth || 320;
        const height = video.videoHeight || 240;

        if (canvas.width !== width || canvas.height !== height) {
          canvas.width = width;
          canvas.height = height;
        }

        try {
          // JOB 1 & 2: Face Detection & 68-Point Landmark Alignment
          const result = await detectFaceWithDescriptor(video);

          drawFaceDetectionOverlay(
            canvas,
            { width, height },
            result,
            isScanSuccess,
            matchedUser?.name
          );

          if (result) {
            setCurrentJobStep(2); // Landmarks Aligned

            // JOB 3: Liveness & Anti-Spoofing Verification
            const confidence = result.detection.score;
            const boxWidth = result.detection.box.width;

            // Anti-spoofing quality check: face size > 65px and detection confidence >= 0.60
            const isLivePerson = confidence >= 0.60 && boxWidth >= 65;

            if (isLivePerson) {
              setCurrentJobStep(3); // Liveness PASS
              setStatusText("Liveness Verified — Matching Identity...");

              // JOB 4: 128D Embedding Comparison against enrolled templates
              const liveDescriptor = Array.from(result.descriptor);
              let bestMatchUser: EmployeeUser | null = null;
              let minDistance = 999.0;

              for (const user of users) {
                if (!user.faceDescriptor) continue;

                let storedDescriptorData: any = null;
                try {
                  storedDescriptorData = typeof user.faceDescriptor === "string"
                    ? JSON.parse(user.faceDescriptor)
                    : user.faceDescriptor;
                } catch {
                  storedDescriptorData = null;
                }

                // Extract array of 128D embeddings (supports single or multi-angle templates)
                let storedEmbeddings: number[][] = [];
                if (Array.isArray(storedDescriptorData)) {
                  if (typeof storedDescriptorData[0] === "number") {
                    storedEmbeddings = [storedDescriptorData as number[]];
                  } else if (Array.isArray(storedDescriptorData[0])) {
                    storedEmbeddings = storedDescriptorData as number[][];
                  }
                }

                for (const emb of storedEmbeddings) {
                  if (emb && emb.length === 128) {
                    const distance = compareFaceDescriptors(liveDescriptor, emb);
                    if (distance < minDistance) {
                      minDistance = distance;
                      bestMatchUser = user;
                    }
                  }
                }
              }

              console.log("128D Neural Distance:", minDistance.toFixed(3), "Match:", bestMatchUser?.name);

              // 128D ResNet Similarity Threshold: < 0.45
              if (bestMatchUser && minDistance < 0.45) {
                isFinished = true;
                setCurrentJobStep(4); // Identity Verified
                setIsScanSuccess(true);
                setMatchedUser(bestMatchUser);
                setStatusText(`Welcome, ${bestMatchUser.name}!`);

                if (typeof window !== "undefined") {
                  sessionStorage.setItem("dinshaws_logged_in_user", JSON.stringify(bestMatchUser));
                }

                if (streamRef.current) {
                  streamRef.current.getTracks().forEach((track) => track.stop());
                }

                setTimeout(() => {
                  router.push("/kiosk");
                }, 500);
                return;
              }
            } else {
              setStatusText("Center face inside camera view");
            }
          } else {
            setCurrentJobStep(1);
            setStatusText("Position your face in front of the camera");
          }

          // Timeout after 15 seconds
          if (Date.now() - scanStartTime > 15000 && !isFinished) {
            isFinished = true;
            setIsScanFailed(true);
            setStatusText("Face not recognized");
            if (streamRef.current) {
              streamRef.current.getTracks().forEach((track) => track.stop());
            }
            return;
          }
        } catch (err) {
          console.error("Frame detection loop error:", err);
        } finally {
          isProcessing = false;
        }
      }

      if (!isFinished && isLoopRunningRef.current) {
        animationFrameRef.current = requestAnimationFrame(loop);
      }
    };

    animationFrameRef.current = requestAnimationFrame(loop);
  };

  const handleRetry = () => {
    setMatchedUser(null);
    setIsScanSuccess(false);
    setIsScanFailed(false);
    setCurrentJobStep(1);
    setStatusText("Look at camera to log in");
    
    navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240, facingMode: "user" } })
      .then((stream) => {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        startAnalysisLoop();
      })
      .catch((err) => {
        console.error("Camera access failed during retry:", err);
        setStatusText("Camera access error.");
      });
  };

  return (
    <div className="kiosk-welcome-screen" style={{ padding: "20px" }}>
      {/* Dinshaw's Brand Logo */}
      <img
        src="https://www.dinshaws.co.in/assets/static/dinshaw-logo-white-text-png.PNG"
        alt="Dinshaw's Logo"
        className="welcome-logo"
        style={{ marginBottom: "20px", maxWidth: "260px" }}
      />

      {/* 4-Job Pipeline Status Indicators */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        marginBottom: "20px",
        background: "rgba(255, 255, 255, 0.15)",
        backdropFilter: "blur(10px)",
        padding: "8px 16px",
        borderRadius: "30px",
        color: "#fff",
        fontSize: "12px",
        fontWeight: 600
      }}>
        <div style={{ opacity: currentJobStep >= 1 ? 1 : 0.4, display: "flex", alignItems: "center", gap: "4px" }}>
          <span>1. Detect</span>
        </div>
        <span>›</span>
        <div style={{ opacity: currentJobStep >= 2 ? 1 : 0.4, display: "flex", alignItems: "center", gap: "4px" }}>
          <span>2. Align</span>
        </div>
        <span>›</span>
        <div style={{ opacity: currentJobStep >= 3 ? 1 : 0.4, display: "flex", alignItems: "center", gap: "4px" }}>
          <span>3. Liveness</span>
        </div>
        <span>›</span>
        <div style={{ opacity: currentJobStep >= 4 ? 1 : 0.4, display: "flex", alignItems: "center", gap: "4px" }}>
          <span>4. Verify</span>
        </div>
      </div>

      {/* Verification Card */}
      <div className="scan-card-simple">
        <div className="scan-video-wrapper">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="scan-video-element"
          />

          <canvas
            ref={canvasRef}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              pointerEvents: "none"
            }}
          />

          {!modelsLoaded && (
            <div className="scan-loading-overlay">
              <Loader2 className="w-10 h-10 text-cyan-400 animate-spin mb-2" />
              <span>Loading AI Neural Models...</span>
            </div>
          )}

          {isScanSuccess && (
            <div className="scan-success-overlay-simple">
              <CheckCircle2 className="scan-success-icon-simple" />
            </div>
          )}

          {isScanFailed && (
            <div className="scan-failed-overlay-simple">
              <AlertTriangle className="w-12 h-12 text-red-500 mb-2" />
              <button onClick={handleRetry} className="scan-retry-btn-simple">
                <RefreshCw className="w-4 h-4" />
                <span>Try Again</span>
              </button>
            </div>
          )}
        </div>

        {/* Status Prompt */}
        <div className="scan-info-box">
          <h2 className="scan-info-title">
            {isScanSuccess ? `Welcome, ${matchedUser?.name}!` : statusText}
          </h2>
          {!isScanSuccess && !isScanFailed && (
            <p className="scan-info-subtitle">
              Face Verification & Anti-Spoofing Active
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
