import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stars, Float, Trail } from '@react-three/drei';
import { useStore } from '../stores/useStore';
import * as THREE from 'three';

// Camera Controller - moves with hand
const CameraController = () => {
    const { camera } = useThree();
    const leftHand = useStore(state => state.leftHand);
    const rightHand = useStore(state => state.rightHand);
    const mode = useStore(state => state.mode);

    const targetPosition = useRef(new THREE.Vector3(0, 0, 18));
    const targetLookAt = useRef(new THREE.Vector3(0, 0, 0));
    const prevHandPos = useRef({ left: null, right: null });
    const zoomLevel = useRef(18);

    useFrame((state, delta) => {
        // ROTATE mode: Both palms control camera orbit
        if (mode === 'ROTATE' && leftHand?.landmarks && rightHand?.landmarks) {
            const leftPalm = leftHand.landmarks[9];
            const rightPalm = rightHand.landmarks[9];

            // Calculate angle from hand positions
            const handCenterX = (leftPalm.x + rightPalm.x) / 2;
            const handCenterY = (leftPalm.y + rightPalm.y) / 2;

            // Orbit camera based on hand center
            const orbitX = (0.5 - handCenterX) * Math.PI;
            const orbitY = (0.5 - handCenterY) * Math.PI * 0.5;

            targetPosition.current.x = Math.sin(orbitX) * zoomLevel.current;
            targetPosition.current.z = Math.cos(orbitX) * zoomLevel.current;
            targetPosition.current.y = orbitY * 10;

            // Zoom with hand distance
            const handDist = Math.sqrt(
                Math.pow(leftPalm.x - rightPalm.x, 2) +
                Math.pow(leftPalm.y - rightPalm.y, 2)
            );
            zoomLevel.current = THREE.MathUtils.lerp(zoomLevel.current, 10 + (1 - handDist) * 30, 0.1);
        }

        // PAN mode: One open palm pans the view
        if (mode === 'IDLE' || mode === 'CREATE') {
            const activeHand = rightHand?.landmarks || leftHand?.landmarks;
            const gesture = rightHand?.gesture || leftHand?.gesture;

            if (gesture === 'OPEN_PALM' && activeHand) {
                const palm = activeHand[9];
                targetLookAt.current.x = (0.5 - palm.x) * 15;
                targetLookAt.current.y = (0.5 - palm.y) * 10;
            }
        }

        // Smooth camera movement
        camera.position.lerp(targetPosition.current, delta * 3);

        const currentLookAt = new THREE.Vector3();
        camera.getWorldDirection(currentLookAt);
        camera.lookAt(
            THREE.MathUtils.lerp(0, targetLookAt.current.x, delta * 2),
            THREE.MathUtils.lerp(0, targetLookAt.current.y, delta * 2),
            0
        );
    });

    return null;
};

// Animated Voxel with glow
const Voxel = ({ position, color, gravity, scale = 1 }) => {
    const meshRef = useRef();
    const velocityRef = useRef({ x: 0, y: 0, z: 0 });
    const initialPos = useRef([...position]);

    useFrame((state, delta) => {
        if (!meshRef.current) return;

        if (gravity) {
            velocityRef.current.y -= 25 * delta;
            velocityRef.current.x += (Math.random() - 0.5) * 8 * delta;
            velocityRef.current.z += (Math.random() - 0.5) * 8 * delta;

            meshRef.current.position.x += velocityRef.current.x * delta;
            meshRef.current.position.y += velocityRef.current.y * delta;
            meshRef.current.position.z += velocityRef.current.z * delta;
            meshRef.current.rotation.x += delta * 3;
            meshRef.current.rotation.z += delta * 2;
        } else {
            // Subtle breathing animation
            const breathe = Math.sin(state.clock.elapsedTime * 2 + initialPos.current[0] * 0.5) * 0.03;
            meshRef.current.position.y = initialPos.current[1] + breathe;
            meshRef.current.scale.setScalar(scale * 0.9 * (1 + breathe * 0.5));
        }
    });

    return (
        <mesh ref={meshRef} position={position}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial
                color={color}
                emissive={color}
                emissiveIntensity={0.5}
                roughness={0.2}
                metalness={0.6}
            />
        </mesh>
    );
};

// 3D Cursor following finger
const Cursor3D = () => {
    const rightHand = useStore(state => state.rightHand);
    const leftHand = useStore(state => state.leftHand);
    const activeColorIndex = useStore(state => state.activeColorIndex);
    const colors = useStore(state => state.colors);
    const mode = useStore(state => state.mode);
    const cursorRef = useRef();

    useFrame(() => {
        const hand = rightHand || leftHand;
        if (hand?.landmarks && cursorRef.current) {
            const tip = hand.landmarks[8]; // Index fingertip
            const x = (0.5 - tip.x) * 25;
            const y = (0.5 - tip.y) * 18;
            const z = Math.min(5, Math.max(-5, tip.z * -40));

            cursorRef.current.position.lerp(
                new THREE.Vector3(x, y, z),
                0.25
            );

            // Scale based on mode
            const targetScale = mode === 'CREATE' ? 1.5 : mode === 'ERASE' ? 2 : 1;
            cursorRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.2);
        }
    });

    if (!rightHand && !leftHand) return null;

    const cursorColor = mode === 'ERASE' ? '#F43F5E' : colors[activeColorIndex];

    return (
        <group ref={cursorRef}>
            {/* Main cursor sphere */}
            <mesh>
                <sphereGeometry args={[0.2, 16, 16]} />
                <meshBasicMaterial color={cursorColor} transparent opacity={0.9} />
            </mesh>

            {/* Outer ring */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.35, 0.4, 32]} />
                <meshBasicMaterial color={cursorColor} transparent opacity={0.5} side={THREE.DoubleSide} />
            </mesh>

            {/* Glow sphere */}
            <mesh>
                <sphereGeometry args={[0.5, 16, 16]} />
                <meshBasicMaterial color={cursorColor} transparent opacity={0.15} />
            </mesh>
        </group>
    );
};

// Hand visualization in 3D space
const Hand3D = ({ landmarks, color }) => {
    const groupRef = useRef();

    const connections = [
        [0, 1], [1, 2], [2, 3], [3, 4],
        [0, 5], [5, 6], [6, 7], [7, 8],
        [0, 9], [9, 10], [10, 11], [11, 12],
        [0, 13], [13, 14], [14, 15], [15, 16],
        [0, 17], [17, 18], [18, 19], [19, 20],
        [5, 9], [9, 13], [13, 17]
    ];

    if (!landmarks) return null;

    return (
        <group ref={groupRef}>
            {/* Joint spheres */}
            {landmarks.map((lm, i) => {
                const x = (0.5 - lm.x) * 25;
                const y = (0.5 - lm.y) * 18;
                const z = lm.z * -20;
                const isTip = [4, 8, 12, 16, 20].includes(i);

                return (
                    <mesh key={i} position={[x, y, z]}>
                        <sphereGeometry args={[isTip ? 0.15 : 0.08, 8, 8]} />
                        <meshBasicMaterial color={color} transparent opacity={0.7} />
                    </mesh>
                );
            })}

            {/* Connection lines */}
            {connections.map(([start, end], i) => {
                const s = landmarks[start];
                const e = landmarks[end];
                const startPos = new THREE.Vector3((0.5 - s.x) * 25, (0.5 - s.y) * 18, s.z * -20);
                const endPos = new THREE.Vector3((0.5 - e.x) * 25, (0.5 - e.y) * 18, e.z * -20);
                const midPos = startPos.clone().add(endPos).multiplyScalar(0.5);
                const length = startPos.distanceTo(endPos);
                const direction = endPos.clone().sub(startPos).normalize();

                return (
                    <mesh
                        key={`line-${i}`}
                        position={midPos}
                        quaternion={new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction)}
                    >
                        <cylinderGeometry args={[0.02, 0.02, length, 4]} />
                        <meshBasicMaterial color={color} transparent opacity={0.4} />
                    </mesh>
                );
            })}
        </group>
    );
};

// Color palette in 3D
const ColorPalette = () => {
    const colors = useStore(state => state.colors);
    const activeColorIndex = useStore(state => state.activeColorIndex);

    return (
        <group position={[-9, -7, 0]}>
            {colors.map((color, i) => (
                <Float key={i} speed={2} floatIntensity={0.3}>
                    <mesh position={[i * 0.9, 0, 0]} scale={i === activeColorIndex ? 1.4 : 0.7}>
                        <sphereGeometry args={[0.22, 16, 16]} />
                        <meshBasicMaterial
                            color={color}
                            transparent
                            opacity={i === activeColorIndex ? 1 : 0.5}
                        />
                    </mesh>
                </Float>
            ))}
        </group>
    );
};

// Main Scene
const Scene = () => {
    const voxels = useStore(state => state.voxels);
    const gravity = useStore(state => state.gravity);
    const mode = useStore(state => state.mode);
    const disco = useStore(state => state.disco);
    const showSkeleton = useStore(state => state.showSkeleton);
    const leftHand = useStore(state => state.leftHand);
    const rightHand = useStore(state => state.rightHand);

    const discoLightRef = useRef();
    const groupRef = useRef();

    useFrame((state) => {
        // Disco light color cycling
        if (disco && discoLightRef.current) {
            const hue = (state.clock.elapsedTime * 150) % 360;
            discoLightRef.current.color.setHSL(hue / 360, 1, 0.5);
        }

        // Slight world rotation in ROTATE mode
        if (mode === 'ROTATE' && groupRef.current) {
            groupRef.current.rotation.y += 0.005;
        }
    });

    // Reset after gravity
    useEffect(() => {
        if (gravity) {
            const timer = setTimeout(() => {
                useStore.getState().resetWorld();
            }, 4000);
            return () => clearTimeout(timer);
        }
    }, [gravity]);

    return (
        <>
            <CameraController />

            {/* Lighting */}
            <ambientLight intensity={0.5} />
            <pointLight position={[15, 15, 15]} intensity={1.2} color="#FFFFFF" />
            <pointLight position={[-15, -10, -15]} intensity={0.6} color="#00F5FF" />
            <pointLight position={[0, -15, 10]} intensity={0.4} color="#FF00E5" />

            {disco && (
                <pointLight
                    ref={discoLightRef}
                    position={[0, 8, 0]}
                    intensity={4}
                    distance={40}
                />
            )}

            {/* Voxels */}
            <group ref={groupRef}>
                {voxels.map((v) => (
                    <Voxel
                        key={v.id}
                        position={v.position}
                        color={v.color}
                        gravity={gravity}
                        scale={v.scale || 1}
                    />
                ))}
            </group>

            {/* 3D Hand visualization */}
            {showSkeleton && (
                <>
                    <Hand3D landmarks={leftHand?.landmarks} color="#00F5FF" />
                    <Hand3D landmarks={rightHand?.landmarks} color="#FF00E5" />
                </>
            )}

            <Cursor3D />

            {/* Grid */}
            <gridHelper
                args={[40, 40, '#1a1a2e', '#0a0a14']}
                rotation={[Math.PI / 2, 0, 0]}
                position={[0, 0, -3]}
            />

            {/* Color palette */}
            <ColorPalette />

            {/* Background */}
            <Stars
                radius={120}
                depth={60}
                count={disco ? 5000 : 2500}
                factor={disco ? 6 : 4}
                saturation={disco ? 1 : 0}
                fade
                speed={disco ? 4 : 0.5}
            />

            {/* Ambient particles */}
            {[...Array(30)].map((_, i) => (
                <Float
                    key={i}
                    speed={1.5}
                    rotationIntensity={0.3}
                    floatIntensity={1.5}
                    position={[
                        (Math.random() - 0.5) * 40,
                        (Math.random() - 0.5) * 25,
                        (Math.random() - 0.5) * 15 - 5
                    ]}
                >
                    <mesh>
                        <octahedronGeometry args={[0.08]} />
                        <meshBasicMaterial color="#00F5FF" transparent opacity={0.25} />
                    </mesh>
                </Float>
            ))}
        </>
    );
};

const World = () => {
    return (
        <div style={{
            position: 'absolute',
            inset: 0,
            zIndex: 0,
            width: '100vw',
            height: '100vh'
        }}>
            <Canvas
                camera={{ position: [0, 0, 18], fov: 50 }}
                gl={{
                    antialias: true,
                    alpha: true,
                    powerPreference: 'high-performance'
                }}
                style={{ background: 'transparent' }}
                dpr={[1, 2]}
            >
                <Scene />
            </Canvas>
        </div>
    );
};

export default World;
