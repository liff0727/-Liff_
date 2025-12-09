
import React from 'react';
import { Loader } from '@react-three/drei';
import Scene from './components/Scene';
import Overlay from './components/Overlay';
import GestureController from './components/GestureController';
import { TreeProvider } from './components/store';

const App: React.FC = () => {
  return (
    <TreeProvider>
        <main className="relative w-full h-full min-h-screen overflow-hidden bg-[#0f0a1e]">
          <Overlay />
          <GestureController />
          <Scene />
          <Loader 
            containerStyles={{ background: '#0f0a1e' }}
            innerStyles={{ width: '40vw', height: '2px', background: '#333' }}
            barStyles={{ background: '#A8E6CF', height: '2px' }}
            dataInterpolation={(p) => `Loading Dreamscape ${p.toFixed(0)}%`}
            initialState={(active) => active}
          />
        </main>
    </TreeProvider>
  );
};

export default App;
