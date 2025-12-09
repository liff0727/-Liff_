
import React, { useEffect, useRef, useState } from 'react';
import { useTreeContext } from './store';
import { TreeMorphState } from '../types';
import * as THREE from 'three';

// Aggressively suppress TFLite/MediaPipe logs to keep console clean
const filterLog = (original: any, ...args: any[]) => {
    try {
        const msg = args.join(' ');
        if (
            msg.includes('XNNPACK') || 
            msg.includes('delegate') || 
            msg.includes('Created TensorFlow Lite') ||
            msg.includes('Wasm')
        ) return;
    } catch (e) {
        // ignore
    }
    original.apply(console, args);
};

const originalInfo = console.info;
console.info = (...args) => filterLog(originalInfo, ...args);

const originalLog = console.log;
console.log = (...args) => filterLog(originalLog, ...args);

const originalWarn = console.warn;
console.warn = (...args) => filterLog(originalWarn, ...args);

const originalError = console.error;
console.error = (...args) => filterLog(originalError, ...args);

const GestureController: React.FC = () => {
  const { setState, handPositionRef } = useTreeContext();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  
  // Refs for gesture recognizer to avoid closure staleness
  const gestureRecognizerRef = useRef<any>(null);
  const rafId = useRef<number | null>(null);
  const lastVideoTime = useRef(-1);
  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    let recognizer: any;

    const init = async () => {
      try {
        console.log("[GestureController] Initializing Camera...");
        await startCamera();

        if (!isMounted.current) return;

        console.log("[GestureController] Importing MediaPipe Vision ESM...");
        const { GestureRecognizer, FilesetResolver } = await import(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/+esm"
        );
        
        console.log("[GestureController] Loading Wasm Fileset...");
        const visionGen = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm"
        );

        if (!isMounted.current) return;

        const modelAssetPath = "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task";

        // FALLBACK STRATEGY: Try GPU, if fail, use CPU
        // We handle the creation logic robustly here
        try {
            // Attempt GPU first
            recognizer = await GestureRecognizer.createFromOptions(visionGen, {
                baseOptions: {
                    modelAssetPath,
                    delegate: "GPU" 
                },
                runningMode: "VIDEO",
                numHands: 1,
                minHandDetectionConfidence: 0.3,
                minHandPresenceConfidence: 0.3,
                minTrackingConfidence: 0.3
            });
        } catch (gpuError) {
            if (!isMounted.current) return;
            
            // CPU Fallback: Lower confidence for MAX SPEED
            // The logs for this fallback are now suppressed
            recognizer = await GestureRecognizer.createFromOptions(visionGen, {
                baseOptions: {
                    modelAssetPath,
                    delegate: "CPU" 
                },
                runningMode: "VIDEO",
                numHands: 1,
                minHandDetectionConfidence: 0.15, // Extremely low for fast CPU detection
                minHandPresenceConfidence: 0.15,
                minTrackingConfidence: 0.15
            });
        }
        
        if (!isMounted.current) {
            if(recognizer) recognizer.close();
            return;
        }

        gestureRecognizerRef.current = recognizer;
        setLoaded(true);
        console.log("[GestureController] Model Ready.");
        
        // Start prediction loop
        predictWebcam();

      } catch (e: any) {
        console.error("[GestureController] Failed to initialize:", e);
        if (isMounted.current) {
            setError("AI Init Failed");
        }
      }
    };

    init();

    return () => {
       isMounted.current = false;
       if (rafId.current) cancelAnimationFrame(rafId.current);
       
       if (gestureRecognizerRef.current) {
           gestureRecognizerRef.current.close();
           gestureRecognizerRef.current = null;
       }

       if (videoRef.current && videoRef.current.srcObject) {
           const stream = videoRef.current.srcObject as MediaStream;
           stream.getTracks().forEach(track => track.stop());
           videoRef.current.srcObject = null;
       }
    };
  }, []);

  const startCamera = async () => {
    if (!videoRef.current) return;
    if (videoRef.current.srcObject) return;

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                width: { ideal: 320 }, 
                height: { ideal: 240 }, 
                frameRate: { ideal: 60 },
                facingMode: "user"
            } 
        });
        
        if (isMounted.current && videoRef.current) {
            videoRef.current.srcObject = stream;
            await videoRef.current.play();
            
            videoRef.current.onloadeddata = () => {
                 if (isMounted.current) setPermissionGranted(true);
            };
        } else {
            stream.getTracks().forEach(t => t.stop());
        }
    } catch (err: any) {
        if (isMounted.current) setError("Camera Access Denied");
    }
  };

  const predictWebcam = async () => {
    const video = videoRef.current;
    const recognizer = gestureRecognizerRef.current;
    
    if (!isMounted.current) return;

    if (!video || !recognizer) {
        rafId.current = requestAnimationFrame(predictWebcam);
        return;
    }

    if (video.videoWidth === 0 || video.videoHeight === 0) {
        rafId.current = requestAnimationFrame(predictWebcam);
        return;
    }

    try {
        if (video.currentTime !== lastVideoTime.current) {
            lastVideoTime.current = video.currentTime;
            
            const startTime = performance.now();
            const results = recognizer.recognizeForVideo(video, startTime);

            if (results.gestures.length > 0) {
                const gesture = results.gestures[0][0];
                const categoryName = gesture.categoryName;
                const score = gesture.score;

                if (score > 0.4) {
                    if (categoryName === "Open_Palm") {
                        setState(TreeMorphState.DREAM);
                    } else if (categoryName === "Closed_Fist") {
                        setState(TreeMorphState.EMERALD);
                    }
                }
            }

            if (results.landmarks.length > 0) {
                const landmarks = results.landmarks[0];
                const point = landmarks[9]; // Middle finger MCP
                
                const targetX = (1 - point.x) * 2 - 1; 
                const targetY = (1 - point.y) * 2 - 1;
                
                const smoothFactor = 0.8;
                const currentX = handPositionRef.current.x;
                const currentY = handPositionRef.current.y;
                
                handPositionRef.current = { 
                    x: THREE.MathUtils.lerp(currentX, targetX, smoothFactor), 
                    y: THREE.MathUtils.lerp(currentY, -targetY, smoothFactor), 
                    active: true 
                };
            }
        }
    } catch (e) {
        // Ignore
    }

    rafId.current = requestAnimationFrame(predictWebcam);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-2 pointer-events-auto">
       <div className={`relative overflow-hidden rounded-xl border-2 border-emerald-400/50 bg-black/80 backdrop-blur-md shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all duration-700 translate-y-0`}>
           <video 
             ref={videoRef} 
             autoPlay
             playsInline 
             muted 
             width="320"
             height="240"
             className="w-40 h-32 object-cover transform scale-x-[-1] opacity-100"
           />
           <div className="absolute bottom-2 right-2 flex items-center gap-1.5 bg-black/70 px-2 py-1 rounded-full backdrop-blur-sm border border-white/10">
               <div className={`w-2 h-2 rounded-full ${loaded ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-yellow-400'} animate-pulse`}></div>
               <span className="text-[10px] text-white/90 tracking-widest uppercase font-bold">
                   {loaded ? 'AI ACTIVE' : (permissionGranted ? 'Loading...' : 'Waiting for Camera')}
               </span>
           </div>
       </div>

       {error && (
           <div className="text-rose-200 text-xs bg-red-900/90 px-3 py-2 rounded border border-rose-500 shadow-xl font-bold">
               ⚠️ {error}
           </div>
       )}
    </div>
  );
};

export default GestureController;
