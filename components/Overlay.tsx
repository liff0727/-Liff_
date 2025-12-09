import React from 'react';
import { useTreeContext } from './store';
import { TreeMorphState } from '../types';

const Overlay: React.FC = () => {
  const { state, handPositionRef } = useTreeContext();

  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-10 flex flex-col justify-between p-8 md:p-12">
      <header className="flex flex-col items-start animate-fade-in">
        <h1 className="text-4xl md:text-6xl text-transparent bg-clip-text bg-gradient-to-r from-rose-200 to-emerald-100 font-serif tracking-widest drop-shadow-lg" style={{ fontFamily: '"Cinzel", serif' }}>
          LUMIÈRE
        </h1>
        <div className="flex items-center gap-4 mt-2">
            <p className="text-rose-100/60 text-sm md:text-base tracking-[0.3em] uppercase font-light">
            Dreamscape Collection • 2025
            </p>
            <div className="px-2 py-0.5 border border-emerald-500/30 bg-emerald-900/20 text-[10px] tracking-widest text-emerald-200 uppercase rounded">
                {state === TreeMorphState.EMERALD ? 'EMERALD MODE' : 'DREAM MODE'}
            </div>
        </div>
      </header>

      <div className="absolute top-1/2 right-8 transform -translate-y-1/2 flex flex-col items-end gap-6 text-emerald-50/60 text-xs tracking-widest text-right">
          <div className="group flex items-center gap-3">
              <span>UNLEASH DREAM</span>
              <div className="w-10 h-10 border border-emerald-500/30 rounded-full flex items-center justify-center bg-black/20 backdrop-blur-sm group-hover:bg-emerald-500/10 transition-colors">
                  ✋
              </div>
          </div>
          <div className="group flex items-center gap-3">
              <span>RESTORE FORM</span>
              <div className="w-10 h-10 border border-emerald-500/30 rounded-full flex items-center justify-center bg-black/20 backdrop-blur-sm group-hover:bg-emerald-500/10 transition-colors">
                  ✊
              </div>
          </div>
           <div className="group flex items-center gap-3">
              <span>PAN VIEW</span>
              <div className="w-10 h-10 border border-emerald-500/30 rounded-full flex items-center justify-center bg-black/20 backdrop-blur-sm group-hover:bg-emerald-500/10 transition-colors">
                  👋
              </div>
          </div>
      </div>

      <footer className="flex justify-between items-end">
        <div className="text-emerald-50/40 text-xs md:text-sm max-w-xs">
          <p className="mb-2 uppercase tracking-wide text-emerald-200/80">
            Interactive Gesture Control
          </p>
          <p className="font-light leading-relaxed">
            Use your camera to control the dream.<br/>
            Open Palm to scatter • Fist to restore • Move hand to look around
          </p>
        </div>
        
        <div className="hidden md:block">
           <div className="h-px w-24 bg-gradient-to-r from-transparent via-rose-200/50 to-transparent mb-2"></div>
           <p className="text-right text-rose-100/40 text-xs tracking-widest">GEMINI STUDIO</p>
        </div>
      </footer>
    </div>
  );
};

export default Overlay;
