
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { HolidayColor } from '../types';
import { foliageShaderMaterial } from './TreeMaterials';
import { useMorphAnimation } from './store';

interface FoliageProps {
    layerCount?: number;
}

const Foliage: React.FC<FoliageProps> = ({ layerCount = 5 }) => {
    const materialRef = useRef<THREE.ShaderMaterial>(null);
    const { getEasedProgress } = useMorphAnimation();
    const particleCount = 4000;

    const { positions, treePos, dreamPos, randoms, sizes } = useMemo(() => {
        const p = new Float32Array(particleCount * 3);
        const tp = new Float32Array(particleCount * 3);
        const dp = new Float32Array(particleCount * 3);
        const r = new Float32Array(particleCount);
        const s = new Float32Array(particleCount);

        for (let i = 0; i < particleCount; i++) {
            // --- Tree Shape (Conical Layers) ---
            const layerIndex = Math.floor(Math.random() * layerCount);
            // const layerHeight = 6.0 / layerCount; // Unused
            const yBase = -2.0 + (Math.random() * 6.0); // Full height distribution
            
            // Cone radius at this Y
            const coneRatio = 1.0 - ((yBase + 2.0) / 6.0);
            const radius = coneRatio * 2.5 * Math.sqrt(Math.random()); // Sqrt for uniform area
            const angle = Math.random() * Math.PI * 2;
            
            tp[i * 3] = Math.cos(angle) * radius;
            tp[i * 3 + 1] = yBase;
            tp[i * 3 + 2] = Math.sin(angle) * radius;

            // --- Dream Shape (Spiral Ascension) ---
            const spiralAngle = angle + (yBase * 2.0); // Twist
            const spiralRadius = radius * 3.0 + 2.0;
            
            dp[i * 3] = Math.cos(spiralAngle) * spiralRadius;
            dp[i * 3 + 1] = yBase * 1.5 + (Math.random() - 0.5) * 4.0;
            dp[i * 3 + 2] = Math.sin(spiralAngle) * spiralRadius;

            // --- Attributes ---
            p[i * 3] = tp[i * 3];
            p[i * 3 + 1] = tp[i * 3 + 1];
            p[i * 3 + 2] = tp[i * 3 + 2];

            r[i] = Math.random();
            s[i] = Math.random() * 0.5 + 0.5; // Base size variation
        }

        return { 
            positions: p, 
            treePos: tp, 
            dreamPos: dp, 
            randoms: r, 
            sizes: s 
        };
    }, [layerCount]);

    useFrame((state) => {
        if (materialRef.current) {
            materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
            materialRef.current.uniforms.uMorphProgress.value = getEasedProgress();
        }
    });

    return (
        <points>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" count={particleCount} array={positions} itemSize={3} />
                <bufferAttribute attach="attributes-aTreePos" count={particleCount} array={treePos} itemSize={3} />
                <bufferAttribute attach="attributes-aDreamPos" count={particleCount} array={dreamPos} itemSize={3} />
                <bufferAttribute attach="attributes-aRandom" count={particleCount} array={randoms} itemSize={1} />
                <bufferAttribute attach="attributes-aSize" count={particleCount} array={sizes} itemSize={1} />
            </bufferGeometry>
            <shaderMaterial 
                ref={materialRef}
                vertexShader={foliageShaderMaterial.vertexShader}
                fragmentShader={foliageShaderMaterial.fragmentShader}
                uniforms={{
                    ...foliageShaderMaterial.uniforms,
                    uColorMain: { value: new THREE.Color(HolidayColor.MINT_SOFT) },
                    uColorHighlight: { value: new THREE.Color(HolidayColor.PEARL_WHITE) }
                }}
                transparent
                depthWrite={false}
                blending={THREE.AdditiveBlending}
            />
        </points>
    );
};

export default Foliage;
