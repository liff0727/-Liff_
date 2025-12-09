
import React, { Suspense, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, PerspectiveCamera, ContactShadows, Float } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, DepthOfField, SMAA, SSAO } from '@react-three/postprocessing';
import * as THREE from 'three';
import { HolidayColor } from '../types';
import ChristmasTree from './ChristmasTree';
import FairyDust from './FairyDust';
import { useTreeContext } from './store';

// Inner component to handle frame updates for Camera
const SceneLogic: React.FC = () => {
    const { handPositionRef } = useTreeContext();
    const controlsRef = useRef<any>(null);

    useFrame((state, delta) => {
        // Camera Gesture Control
        if (controlsRef.current && handPositionRef.current.active) {
            const { x, y } = handPositionRef.current;
            // Map hand x/y (-1 to 1) to target x/y
            // Range adjusted for cinematic feel
            const targetX = x * 5; 
            const targetY = y * 3; 
            
            // INCREASED SPEED: Damping factor 12.0 for INSTANT response
            const damp = THREE.MathUtils.damp;
            controlsRef.current.target.x = damp(controlsRef.current.target.x, targetX, 12.0, delta);
            controlsRef.current.target.y = damp(controlsRef.current.target.y, targetY, 12.0, delta);
        } else if (controlsRef.current) {
            // Return to center
            const damp = THREE.MathUtils.damp;
            controlsRef.current.target.x = damp(controlsRef.current.target.x, 0, 2.0, delta);
            controlsRef.current.target.y = damp(controlsRef.current.target.y, 0, 2.0, delta);
        }
        
        controlsRef.current?.update();
    });

    return (
        <OrbitControls 
            ref={controlsRef}
            enablePan={false} 
            minPolarAngle={Math.PI / 4} 
            maxPolarAngle={Math.PI / 1.8}
            minDistance={4}
            maxDistance={25}
            autoRotate
            autoRotateSpeed={0.3} // Slower auto rotate for elegance
        />
    );
};

export default function Scene() {
  const ssaoColor = useMemo(() => new THREE.Color("black"), []);

  return (
    <div className="w-full h-screen bg-black">
      {/* 
        Phase II & III: High Definition Rendering 
        dpr restricted to [1, 2] to prevent crashes on extremely high density screens
      */}
      <Canvas shadows dpr={[1, 2]} gl={{ antialias: false, stencil: false, depth: true, powerPreference: "high-performance" }}>
        {/* Phase IV: Deep Blue/Purple Fog Background */}
        <color attach="background" args={['#0f0a1e']} />
        <fog attach="fog" args={['#0f0a1e', 10, 40]} />

        {/* Phase IV: Camera Position */}
        <PerspectiveCamera makeDefault position={[0, 3, 15]} fov={45} />
        
        {/* Phase IV: Soft Studio Lighting + Deep AO Contrast */}
        <ambientLight intensity={0.5} color={HolidayColor.MINT_SOFT} />
        <spotLight 
            position={[5, 12, 5]} 
            angle={0.25} 
            penumbra={1} 
            intensity={2.0} 
            castShadow 
            shadow-bias={-0.0001}
            color={HolidayColor.CHAMPAGNE}
        />
        <pointLight position={[-5, 5, -5]} intensity={1.5} color={HolidayColor.ROSE_GOLD} />
        <pointLight position={[0, -2, 4]} intensity={0.5} color="#a0c0ff" />
        
        <Suspense fallback={null}>
            {/* Soft Studio Environment */}
            <Environment preset="city" environmentIntensity={0.6} blur={0.8} />
            
            <Float speed={1.0} rotationIntensity={0.1} floatIntensity={0.2}>
                <ChristmasTree />
            </Float>
            
            <FairyDust />
            
            <ContactShadows 
                resolution={256} 
                scale={25} 
                blur={3} 
                opacity={0.8} 
                far={10} 
                color="#000000" 
                frames={1} // Static shadows for performance
            />
        </Suspense>

        <SceneLogic />

        {/* Phase IV: Post Processing */}
        <EffectComposer enableNormalPass={true} multisampling={0}>
            {/* SMAA for Superior Anti-Aliasing */}
            <SMAA />
            
            {/* SSAO for Deep Ambient Occlusion & Contrast */}
            <SSAO 
                radius={0.1} 
                intensity={20} 
                luminanceInfluence={0.5} 
                color={ssaoColor} 
            />
            
            {/* 
               Optimized Bloom:
               Threshold 0.98 (Only very bright things glow)
            */}
            <Bloom 
                luminanceThreshold={0.98} 
                mipmapBlur 
                intensity={1.0} 
                radius={0.8} 
            />
            
            {/* Depth of Field: Focus on Tree Center */}
            <DepthOfField 
                target={[0, 2, 0]} 
                focalLength={0.02} 
                bokehScale={3} 
                height={480} 
            />
            
            {/* Vignette: Soft */}
            <Vignette eskil={false} offset={0.1} darkness={0.4} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
