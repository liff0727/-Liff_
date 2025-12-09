
import React from 'react';
import { MeshPhysicalMaterial, MeshStandardMaterial, CanvasTexture, RepeatWrapping, Vector2 } from 'three';
import { HolidayColor } from '../types';

// --- Procedural Texture Generation helpers ---

// Generate a high-res noise texture for "Hammered Metal" (2048x2048)
const createNoiseTexture = () => {
    const size = 2048; // High resolution for fidelity
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (ctx) {
        ctx.fillStyle = '#808080'; // Neutral gray base
        ctx.fillRect(0, 0, size, size);
        for (let i = 0; i < 80000; i++) { // Increased particle count for detail
            const x = Math.random() * size;
            const y = Math.random() * size;
            const radius = Math.random() * 3 + 1;
            const shade = Math.random() * 40 - 20; 
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgb(${128 + shade}, ${128 + shade}, ${128 + shade})`;
            ctx.fill();
        }
    }
    const texture = new CanvasTexture(canvas);
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
    return texture;
};

const hammeredNormalMap = createNoiseTexture();

// 1. Diamond/Cut Crystal (High IOR, Dispersion, Faceted feel)
export const crystalMaterial = new MeshPhysicalMaterial({
  color: HolidayColor.CRYSTAL_CLEAR,
  metalness: 0.1,
  roughness: 0.0,
  transmission: 1.0, 
  thickness: 2.0, // Increased thickness for refraction
  ior: 2.4, // Diamond IOR
  clearcoat: 1.0,
  clearcoatRoughness: 0.0,
  attenuationColor: "#ffffff",
  attenuationDistance: 0.8,
  emissive: "#ffffff",
  emissiveIntensity: 0.4, // Controlled emissive (0.4-0.6 range)
  dispersion: 0.8, 
  toneMapped: false
});

// 2. Rose Gold Hammered Metal (Bump map, High Detail)
export const metalBaubleMaterial = new MeshPhysicalMaterial({
  color: HolidayColor.ROSE_GOLD,
  metalness: 1.0,
  roughness: 0.2,
  clearcoat: 1.0,
  clearcoatRoughness: 0.1,
  bumpMap: hammeredNormalMap,
  bumpScale: 0.015, // Fine hammered detail
  emissive: HolidayColor.ROSE_GOLD,
  emissiveIntensity: 0.0, // Rely on reflection for luxury
});

// 3. Velvet Gift Box (High Sheen, Soft)
export const velvetMaterial = new MeshPhysicalMaterial({
  color: HolidayColor.VELVET_PINK,
  metalness: 0.1,
  roughness: 0.8,
  sheen: 2.0, // Strong sheen
  sheenColor: HolidayColor.PEARL_WHITE,
  sheenRoughness: 0.5,
  emissive: HolidayColor.VELVET_PINK,
  emissiveIntensity: 0.05
});

// 4. Star Material (Balanced Glow)
export const starMaterial = new MeshStandardMaterial({
  color: HolidayColor.CHAMPAGNE,
  emissive: HolidayColor.CHAMPAGNE,
  emissiveIntensity: 0.6, // Reduced bloom contribution
  toneMapped: false,
  roughness: 0.2,
  metalness: 0.9
});

// 5. Pearl Material (New Iridescent)
export const pearlMaterial = new MeshPhysicalMaterial({
    color: HolidayColor.PEARL_CREAM,
    metalness: 0.0,
    roughness: 0.05,
    clearcoat: 1.0, 
    clearcoatRoughness: 0.05,
    iridescence: 1.0,
    iridescenceIOR: 1.8,
    iridescenceThicknessRange: [200, 500],
    emissive: HolidayColor.PEARL_CREAM,
    emissiveIntensity: 0.3
});

// 6. Foliage Particle Shader Uniforms helper
export const foliageShaderMaterial = {
    uniforms: {
        uTime: { value: 0 },
        uMorphProgress: { value: 0 },
        uColorMain: { value: null }, // Set in component
        uColorHighlight: { value: null } // Set in component
    },
    vertexShader: `
      precision highp float;
      uniform float uTime;
      uniform float uMorphProgress;
      
      attribute vec3 aTreePos;
      attribute vec3 aDreamPos;
      attribute float aRandom;
      attribute float aSize;
      
      varying vec2 vUv;
      varying float vAlpha;
      varying vec3 vColor;

      void main() {
        vUv = uv;
        
        // Morph Position
        vec3 pos = mix(aTreePos, aDreamPos, uMorphProgress);
        
        // Breathing Effect (3% pulsation)
        float breath = 1.0 + sin(uTime * 2.0 + aRandom * 10.0) * 0.03;
        
        // Dream Float Effect
        float floatY = sin(uTime * 0.5 + aRandom * 5.0) * uMorphProgress * 2.0;
        
        vec3 finalPos = pos * breath;
        finalPos.y += floatY;

        vec4 mvPosition = modelViewMatrix * vec4(finalPos, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        
        // Size attenuation
        gl_PointSize = aSize * (180.0 / -mvPosition.z);
        
        // Vary alpha based on pulse
        vAlpha = 0.7 + 0.3 * sin(uTime * 3.0 + aRandom);
      }
    `,
    fragmentShader: `
      precision highp float;
      varying vec2 vUv;
      varying float vAlpha;
      uniform vec3 uColorMain;
      uniform vec3 uColorHighlight;

      void main() {
        // Soft Star/Sparkle Shape Calculation
        vec2 uv = gl_PointCoord * 2.0 - 1.0;
        
        float d = length(uv);
        
        // Sharper star shape logic
        // 4-pointed star
        float angle = atan(uv.y, uv.x);
        float spikes = cos(angle * 4.0); 
        // Mix circle and spikes for "Sparkle" shape
        float shapeDist = d + spikes * 0.15; // distort distance
        float shape = smoothstep(0.5, 0.3, shapeDist);

        if (shape < 0.05) discard;
        
        vec3 color = mix(uColorMain, uColorHighlight, shape * 0.5);
        
        // Champagne Gold Edge Glow
        if (d > 0.3) {
            color = mix(color, vec3(1.0, 0.9, 0.7), 0.3);
        }

        // REDUCED BRIGHTNESS: Reduced by 40% (0.6 multiplier)
        gl_FragColor = vec4(color * 0.6, vAlpha * shape); 
      }
    `
};
