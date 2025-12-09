import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { TreeMorphState, TreeContextType } from '../types';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const TreeContext = createContext<TreeContextType | undefined>(undefined);

export const TreeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<TreeMorphState>(TreeMorphState.EMERALD);
  const handPositionRef = useRef({ x: 0, y: 0, active: false });
  const morphProgressRef = useRef(0);

  return (
    <TreeContext.Provider value={{ state, setState, handPositionRef, morphProgressRef }}>
      {children}
    </TreeContext.Provider>
  );
};

export const useTreeContext = () => {
  const context = useContext(TreeContext);
  if (!context) {
    throw new Error('useTreeContext must be used within a TreeProvider');
  }
  return context;
};

// Hook to get smooth animated values inside Canvas components
export const useMorphAnimation = () => {
    const { state, morphProgressRef } = useTreeContext();
    
    useFrame((_, delta) => {
        const target = state === TreeMorphState.DREAM ? 1 : 0;
        // Move towards target. 3 seconds duration means speed is roughly 1/3 per second.
        // We use a linear approach here but map it to Ease-InOut-Sine later for the visual effect
        const speed = 1.0 / 3.0; 
        
        if (morphProgressRef.current < target) {
            morphProgressRef.current = Math.min(target, morphProgressRef.current + delta * speed);
        } else if (morphProgressRef.current > target) {
            morphProgressRef.current = Math.max(target, morphProgressRef.current - delta * speed);
        }
    });

    const getEasedProgress = () => {
        const t = morphProgressRef.current;
        // Ease-InOut-Sine: -(cos(PI * x) - 1) / 2
        return -(Math.cos(Math.PI * t) - 1) / 2;
    };

    return { getEasedProgress, rawProgress: morphProgressRef };
};
