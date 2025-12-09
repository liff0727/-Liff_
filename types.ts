
import React from 'react';

export interface OrnamentProps {
  position: [number, number, number];
  color: string;
  scale?: number;
}

export interface TreeLayerProps {
  position: [number, number, number];
  scale: number;
  color: string;
}

export enum HolidayColor {
  MINT_SOFT = "#A8E6CF",
  MINT_DEEP = "#3D8B78",
  ROSE_GOLD = "#E0BFB8",
  CHAMPAGNE = "#F5E6CA",
  PEARL_WHITE = "#F8F9FA",
  DEEP_EMERALD = "#0B2620",
  // New Palette
  VELVET_PINK = "#F4C2C2",
  CRYSTAL_CLEAR = "#EEF5F5",
  STARDUST_PURPLE = "#E6E6FA",
  GLOW_CHAMPAGNE = "#FFF8E7",
  PEARL_CREAM = "#FDFCF0"
}

export enum TreeMorphState {
  EMERALD = 'EMERALD',
  DREAM = 'DREAM'
}

export interface TreeContextType {
  state: TreeMorphState;
  setState: (state: TreeMorphState) => void;
  handPositionRef: React.MutableRefObject<{ x: number; y: number; active: boolean }>;
  morphProgressRef: React.MutableRefObject<number>; // 0 to 1
}
