
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { HolidayColor } from '../types';

const FairyDust: React.FC = () => {
  const count = 1500; // Increased count for dense dream atmosphere
  const mesh = useRef<THREE.Points>(null);
  
  const particlesPosition = useMemo(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20; // Wide spread x
      positions[i * 3 + 1] = (Math.random() - 0.5) * 20 + 5; // y
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20; // z
    }
    return positions;
  }, [count]);

  const particlesData = useMemo(() => {
     return new Array(count).fill(0).map(() => ({
         speed: Math.random() * 0.01 + 0.002,
         offset: Math.random() * 100
     }));
  }, [count]);

  useFrame((state) => {
      if (!mesh.current) return;
      
      const positions = mesh.current.geometry.attributes.position.array as Float32Array;
      
      for(let i=0; i<count; i++) {
          const i3 = i * 3;
          // Float down
          positions[i3 + 1] -= particlesData[i].speed;
          
          // Gentle Wiggle
          positions[i3] += Math.sin(state.clock.elapsedTime * 0.3 + particlesData[i].offset) * 0.01;
          
          // Reset if too low
          if (positions[i3 + 1] < -5) {
              positions[i3 + 1] = 15;
          }
      }
      mesh.current.geometry.attributes.position.needsUpdate = true;
      mesh.current.rotation.y = state.clock.elapsedTime * 0.01;
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particlesPosition.length / 3}
          array={particlesPosition}
          itemSize={3}
        />
      </bufferGeometry>
      {/* 
        Phase III: Very Light Element 
        Pure emissive Fairy Dust in Stardust Purple / Soft Pink
      */}
      <pointsMaterial
        size={0.06}
        color={HolidayColor.STARDUST_PURPLE}
        transparent
        opacity={0.8}
        sizeAttenuation={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

export default FairyDust;
