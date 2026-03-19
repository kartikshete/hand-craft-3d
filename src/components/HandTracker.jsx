import React, { useEffect, useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { useStore } from '../stores/useStore';
import { detectGesture, getPinchPosition } from '../logic/gestures';

const HandTracker = () => {
    const webcamRef = useRef(null);
    const canvasRef = useRef(null);
    const [isReady, setIsReady] = useState(false);
    const [error, setError] = useState(null);

    const setHandData = useStore(state => state.setHandData);
    const setMode = useStore(state => state.setMode);
    const addVoxel = useStore(state => state.addVoxel);
    const removeVoxel = useStore(state => state.removeVoxel);
    const toggleGravity = useStore(state => state.toggleGravity);
    const toggleDisco = useStore(state => state.toggleDisco);
    const nextColor = useStore(state => state.nextColor);
    const undo = useStore(state => state.undo);
    const clearVoxels = useStore(state => state.clearVoxels);
    const showSkeleton = useStore(state => state.showSkeleton);
    const brushSize = useStore(state => state.brushSize);

    const landmarkerRef = useRef(null);
    const animationRef = useRef(null);
    const lastTimeRef = useRef(-1);
    const lastActionRef = useRef(0);
    const lastToggleRef = useRef(0);
    const lastColorRef = useRef(0);

    // Sound effects
    const playSound = useCallback((type) => {
        const sounds = {
            create: [440, 0.1],
            erase: [220, 0.1],
            toggle: [880, 0.15],
            color: [660, 0.08]
        };

        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.value = sounds[type]?.[0] || 440;
            gain.gain.value = 0.1;
            osc.start();
            osc.stop(ctx.currentTime + (sounds[type]?.[1] || 0.1));
        } catch (e) { }
    }, []);

    // Initialize MediaPipe
    useEffect(() => {
        let mounted = true;

        const init = async () => {
            try {
                const vision = await FilesetResolver.forVisionTasks(
                    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
                );

                const landmarker = await HandLandmarker.createFromOptions(vision, {
                    baseOptions: {
                        modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
                        delegate: "GPU"
                    },
                    runningMode: "VIDEO",
                    numHands: 2
                });

                if (mounted) {
                    landmarkerRef.current = landmarker;
                    setIsReady(true);
                    console.log("✅ Hand Landmarker Ready");
                }
            } catch (err) {
                console.error("MediaPipe init error:", err);
                setError("Camera/AI init failed. Allow camera access.");
            }
        };

        init();
        return () => { mounted = false; };
    }, []);

    // Draw hand skeleton on canvas
    const drawSkeleton = useCallback((landmarks, ctx, width, height, color = '#00F5FF') => {
        if (!landmarks || !ctx) return;

        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.fillStyle = color;

        // Connections
        const connections = [
            [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
            [0, 5], [5, 6], [6, 7], [7, 8], // Index
            [0, 9], [9, 10], [10, 11], [11, 12], // Middle
            [0, 13], [13, 14], [14, 15], [15, 16], // Ring
            [0, 17], [17, 18], [18, 19], [19, 20], // Pinky
            [5, 9], [9, 13], [13, 17] // Palm
        ];

        connections.forEach(([start, end]) => {
            const s = landmarks[start];
            const e = landmarks[end];
            ctx.beginPath();
            ctx.moveTo(s.x * width, s.y * height);
            ctx.lineTo(e.x * width, e.y * height);
            ctx.stroke();
        });

        // Draw points
        landmarks.forEach((lm, i) => {
            const x = lm.x * width;
            const y = lm.y * height;
            const size = [4, 8, 12, 16, 20].includes(i) ? 8 : 4; // Bigger for fingertips

            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        });
    }, []);

    // Process frame
    const processFrame = useCallback(() => {
        if (!webcamRef.current?.video || !landmarkerRef.current) {
            animationRef.current = requestAnimationFrame(processFrame);
            return;
        }

        const video = webcamRef.current.video;
        if (video.readyState !== 4) {
            animationRef.current = requestAnimationFrame(processFrame);
            return;
        }

        const now = performance.now();
        if (video.currentTime === lastTimeRef.current) {
            animationRef.current = requestAnimationFrame(processFrame);
            return;
        }

        lastTimeRef.current = video.currentTime;

        try {
            const results = landmarkerRef.current.detectForVideo(video, now);

            // Clear and draw skeleton
            const canvas = canvasRef.current;
            if (canvas && showSkeleton) {
                const ctx = canvas.getContext('2d');
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                ctx.clearRect(0, 0, canvas.width, canvas.height);

                if (results.landmarks) {
                    results.landmarks.forEach((lm, i) => {
                        const color = i === 0 ? '#00F5FF' : '#FF00E5';
                        drawSkeleton(lm, ctx, canvas.width, canvas.height, color);
                    });
                }
            }

            if (results.landmarks && results.landmarks.length > 0) {
                processHands(results.landmarks, results.handedness);
            } else {
                setHandData('Left', null);
                setHandData('Right', null);
                setMode('IDLE');
            }
        } catch (e) {
            console.warn("Detection error:", e);
        }

        animationRef.current = requestAnimationFrame(processFrame);
    }, [showSkeleton, drawSkeleton]);

    useEffect(() => {
        if (isReady) {
            animationRef.current = requestAnimationFrame(processFrame);
        }
        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [isReady, processFrame]);

    const processHands = (landmarks, handedness) => {
        const now = Date.now();
        let leftGesture = 'NONE';
        let rightGesture = 'NONE';
        let leftHand = null;
        let rightHand = null;

        landmarks.forEach((lm, i) => {
            const label = handedness[i]?.[0]?.categoryName || 'Right';
            const gesture = detectGesture(lm);

            if (label === 'Left') {
                leftHand = lm;
                leftGesture = gesture;
                setHandData('Left', { landmarks: lm, gesture });
            } else {
                rightHand = lm;
                rightGesture = gesture;
                setHandData('Right', { landmarks: lm, gesture });
            }
        });

        // === GESTURE CONTROLS ===

        // ROTATE: Both palms open
        if (leftGesture === 'OPEN_PALM' && rightGesture === 'OPEN_PALM') {
            setMode('ROTATE');
            return;
        }

        // GRAVITY: Horns gesture
        if ((leftGesture === 'GRAVITY' || rightGesture === 'GRAVITY') && now - lastToggleRef.current > 2000) {
            toggleGravity();
            playSound('toggle');
            lastToggleRef.current = now;
            return;
        }

        // DISCO: Peace/V-Sign
        if ((leftGesture === 'PEACE' || rightGesture === 'PEACE') && now - lastToggleRef.current > 2000) {
            toggleDisco();
            playSound('toggle');
            lastToggleRef.current = now;
            return;
        }

        // COLOR CHANGE: Thumbs up
        if ((leftGesture === 'THUMBS_UP' || rightGesture === 'THUMBS_UP') && now - lastColorRef.current > 500) {
            nextColor();
            playSound('color');
            lastColorRef.current = now;
            return;
        }

        // UNDO: Shaka gesture (thumb + pinky)
        if ((leftGesture === 'SHAKA' || rightGesture === 'SHAKA') && now - lastToggleRef.current > 1000) {
            undo();
            lastToggleRef.current = now;
            return;
        }

        // CLEAR: Three fingers up
        if ((leftGesture === 'THREE' || rightGesture === 'THREE') && now - lastToggleRef.current > 2000) {
            clearVoxels();
            lastToggleRef.current = now;
            return;
        }

        // Process each hand for drawing
        const hands = [
            { hand: rightHand, gesture: rightGesture },
            { hand: leftHand, gesture: leftGesture }
        ];

        for (const { hand, gesture } of hands) {
            if (!hand) continue;

            // PINCH: Create voxel
            if (gesture === 'PINCH' && now - lastActionRef.current > 80) {
                setMode('CREATE');
                const pinchPos = getPinchPosition(hand);
                if (pinchPos) {
                    const x = Math.round((0.5 - pinchPos.x) * 20);
                    const y = Math.round((0.5 - pinchPos.y) * 20);
                    // Use z from pinch for 3D depth
                    const z = Math.round(pinchPos.z * -50);
                    addVoxel([x, y, Math.max(-5, Math.min(5, z))]);
                    playSound('create');
                    lastActionRef.current = now;
                }
                return;
            }

            // POINT: Single finger draw (index finger tip)
            if (gesture === 'POINT' && now - lastActionRef.current > 100) {
                setMode('CREATE');
                const indexTip = hand[8];
                const x = Math.round((0.5 - indexTip.x) * 20);
                const y = Math.round((0.5 - indexTip.y) * 20);
                const z = Math.round(indexTip.z * -30);
                addVoxel([x, y, Math.max(-3, Math.min(3, z))]);
                playSound('create');
                lastActionRef.current = now;
                return;
            }

            // FIST: Erase
            if (gesture === 'FIST' && now - lastActionRef.current > 60) {
                setMode('ERASE');
                const palm = hand[9];
                const x = Math.round((0.5 - palm.x) * 20);
                const y = Math.round((0.5 - palm.y) * 20);
                removeVoxel([x, y, 0], brushSize + 1);
                playSound('erase');
                lastActionRef.current = now;
                return;
            }
        }

        setMode('IDLE');
    };

    return (
        <div className="absolute inset-0" style={{ zIndex: -1 }}>
            <Webcam
                ref={webcamRef}
                mirrored
                style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    opacity: 0.6,
                    transform: 'scaleX(-1)'
                }}
                videoConstraints={{
                    facingMode: "user",
                    width: 1280,
                    height: 720
                }}
                onUserMediaError={(err) => setError(err?.message || 'Camera access denied')}
            />

            {/* Skeleton overlay */}
            {showSkeleton && (
                <canvas
                    ref={canvasRef}
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        pointerEvents: 'none',
                        transform: 'scaleX(-1)'
                    }}
                />
            )}

            {error && (
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    background: 'rgba(244,63,94,0.9)',
                    color: 'white',
                    padding: '20px 40px',
                    borderRadius: '12px',
                    textAlign: 'center',
                    zIndex: 100
                }}>
                    <div style={{ fontSize: '24px', marginBottom: '10px' }}>⚠️</div>
                    <div style={{ fontWeight: 'bold' }}>{error}</div>
                    <div style={{ fontSize: '12px', marginTop: '10px', opacity: 0.8 }}>
                        Please allow camera access and reload
                    </div>
                </div>
            )}
        </div>
    );
};

export default HandTracker;
