
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { HolidayColor } from '../types';
import { starMaterial } from './TreeMaterials';
import Ornaments from './Ornaments';
import Foliage from './Foliage';
import { useMorphAnimation } from './store';

const ChristmasTree: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);
  const starRef = useRef<THREE.Mesh>(null);
  const { getEasedProgress } = useMorphAnimation();

  useFrame((state) => {
      // Rotate the whole group gently
      if(groupRef.current) {
          groupRef.current.rotation.y = state.clock.elapsedTime * 0.05;
      }

      // Star Animation
      if (starRef.current) {
          const t = getEasedProgress();
          const time = state.clock.elapsedTime;
          // Star floats higher and spins faster in dream mode
          starRef.current.position.y = 4.0 + t * 4.0 + Math.sin(time) * 0.1;
          starRef.current.rotation.y = time * (0.2 + t * 0.5);
          starRef.current.rotation.z = Math.sin(time) * 0.1 * t;
          
          const s = 1 + t * 0.5;
          starRef.current.scale.set(s, s, s);
      }
  });

  return (
    <group ref={groupRef} position={[0, -1, 0]}>
      {/* 
        Phase III: Replaced solid cones with Volumetric Particle Foliage 
        This handles the "Soft Mint" & "Breathing" Shader requirements
      */}
      <Foliage />

      {/* 
         Phase III: Multi-Material Ornament System 
         (Crystal, Metal, Velvet)
      */}
      <Ornaments />

      {/* Trunk - Minimalist dark base */}
      <mesh position={[0, -1.8, 0]} receiveShadow>
        <cylinderGeometry args={[0.2, 0.5, 1.5, 8]} />
        <meshStandardMaterial color="#2a1d18" roughness={0.9} />
      </mesh>

      {/* Main Topper Star */}
      <mesh ref={starRef} position={[0, 4.0, 0]}>
        <octahedronGeometry args={[0.3, 0]} />
        <primitive object={starMaterial} attach="material" />
      </mesh>
      
      {/* Light Source inside the tree for inner glow */}
      <pointLight position={[0, 1, 0]} intensity={2} distance={5} color={HolidayColor.MINT_SOFT} />
    </group>
  );
};

export default ChristmasTree;
