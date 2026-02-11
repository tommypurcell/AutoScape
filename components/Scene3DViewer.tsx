import React, { useRef, useEffect, useState, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment, ContactShadows, Html } from '@react-three/drei';
import { Loader, RotateCcw, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import * as THREE from 'three';

interface Scene3DViewerProps {
    modelUrl: string;
    thumbnailUrl?: string;
    onError?: (error: string) => void;
}

// Model component that loads and displays the GLB
function Model({ url }: { url: string }) {
    const { scene } = useGLTF(url);
    const modelRef = useRef<THREE.Group>(null);

    useEffect(() => {
        if (scene) {
            // Center and scale the model
            const box = new THREE.Box3().setFromObject(scene);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());

            // Center the model
            scene.position.sub(center);

            // Scale to fit in view
            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = 2 / maxDim;
            scene.scale.setScalar(scale);
        }
    }, [scene]);

    // Gentle auto-rotation
    useFrame((state) => {
        if (modelRef.current) {
            modelRef.current.rotation.y += 0.002;
        }
    });

    return (
        <group ref={modelRef}>
            <primitive object={scene} />
        </group>
    );
}

// Loading fallback inside canvas
function LoadingFallback() {
    return (
        <Html center>
            <div className="flex flex-col items-center gap-2 text-slate-600">
                <Loader className="w-8 h-8 animate-spin text-emerald-600" />
                <span className="text-sm">Loading 3D model...</span>
            </div>
        </Html>
    );
}

// Camera controller for zoom
function CameraController({ zoom }: { zoom: number }) {
    const { camera } = useThree();

    useEffect(() => {
        if (camera instanceof THREE.PerspectiveCamera) {
            camera.position.z = 5 / zoom;
            camera.updateProjectionMatrix();
        }
    }, [camera, zoom]);

    return null;
}

export const Scene3DViewer: React.FC<Scene3DViewerProps> = ({
    modelUrl,
    thumbnailUrl,
    onError
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [zoom, setZoom] = useState(1);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [autoRotate, setAutoRotate] = useState(true);

    const handleError = (err: Error) => {
        const message = err.message || 'Failed to load 3D model';
        setError(message);
        onError?.(message);
        setIsLoading(false);
    };

    const handleLoaded = () => {
        setIsLoading(false);
    };

    const toggleFullscreen = async () => {
        if (!containerRef.current) return;

        if (!document.fullscreenElement) {
            await containerRef.current.requestFullscreen();
            setIsFullscreen(true);
        } else {
            await document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    const resetView = () => {
        setZoom(1);
        setAutoRotate(true);
    };

    // Handle fullscreen change events
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    if (error) {
        return (
            <div className="w-full h-64 bg-slate-100 rounded-xl flex flex-col items-center justify-center gap-3 text-slate-600">
                <div className="text-red-500">Failed to load 3D model</div>
                <div className="text-sm text-slate-500">{error}</div>
                {thumbnailUrl && (
                    <img src={thumbnailUrl} alt="3D Preview" className="w-32 h-32 object-cover rounded-lg mt-2" />
                )}
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className={`relative w-full bg-gradient-to-b from-slate-100 to-slate-200 rounded-xl overflow-hidden ${isFullscreen ? 'h-screen' : 'h-[400px]'
                }`}
        >
            {/* Loading overlay */}
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-100/80 z-10">
                    <div className="flex flex-col items-center gap-2">
                        <Loader className="w-8 h-8 animate-spin text-emerald-600" />
                        <span className="text-sm text-slate-600">Loading 3D scene...</span>
                    </div>
                </div>
            )}

            {/* Three.js Canvas */}
            <Canvas
                camera={{ position: [0, 1, 5], fov: 50 }}
                onCreated={() => setIsLoading(false)}
                gl={{ antialias: true, alpha: true }}
            >
                <CameraController zoom={zoom} />

                {/* Lighting */}
                <ambientLight intensity={0.5} />
                <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
                <directionalLight position={[-10, 10, -5]} intensity={0.5} />

                {/* Environment for reflections */}
                <Environment preset="sunset" />

                {/* Ground shadow */}
                <ContactShadows
                    position={[0, -1, 0]}
                    opacity={0.4}
                    scale={10}
                    blur={2}
                />

                {/* Model */}
                <Suspense fallback={<LoadingFallback />}>
                    <Model url={modelUrl} />
                </Suspense>

                {/* Controls */}
                <OrbitControls
                    enablePan={true}
                    enableZoom={true}
                    enableRotate={true}
                    autoRotate={autoRotate}
                    autoRotateSpeed={1}
                    onStart={() => setAutoRotate(false)}
                />
            </Canvas>

            {/* Control buttons */}
            <div className="absolute bottom-4 left-4 flex gap-2">
                <button
                    onClick={() => setZoom(z => Math.min(z + 0.2, 3))}
                    className="p-2 bg-white/90 rounded-lg shadow hover:bg-white transition-colors"
                    title="Zoom in"
                >
                    <ZoomIn className="w-4 h-4 text-slate-700" />
                </button>
                <button
                    onClick={() => setZoom(z => Math.max(z - 0.2, 0.5))}
                    className="p-2 bg-white/90 rounded-lg shadow hover:bg-white transition-colors"
                    title="Zoom out"
                >
                    <ZoomOut className="w-4 h-4 text-slate-700" />
                </button>
                <button
                    onClick={resetView}
                    className="p-2 bg-white/90 rounded-lg shadow hover:bg-white transition-colors"
                    title="Reset view"
                >
                    <RotateCcw className="w-4 h-4 text-slate-700" />
                </button>
                <button
                    onClick={toggleFullscreen}
                    className="p-2 bg-white/90 rounded-lg shadow hover:bg-white transition-colors"
                    title="Fullscreen"
                >
                    <Maximize2 className="w-4 h-4 text-slate-700" />
                </button>
            </div>

            {/* Instructions */}
            <div className="absolute top-4 right-4 text-xs text-slate-500 bg-white/80 px-2 py-1 rounded">
                Drag to rotate | Scroll to zoom | Shift+drag to pan
            </div>
        </div>
    );
};

// Preload helper for better UX
useGLTF.preload;

export default Scene3DViewer;
