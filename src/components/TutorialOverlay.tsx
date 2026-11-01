import React from 'react';
import { useGameStore } from '../systems/useGameStore';

export const TutorialOverlay: React.FC = () => {
  const { tutorialSeen, currentStage } = useGameStore();

  if (tutorialSeen || currentStage !== 1) {
    return null;
  }

  return (
    <div className="absolute inset-x-0 bottom-24 z-20 pointer-events-none flex flex-col items-center justify-center p-4 select-none">
      <div className="bg-black/75 backdrop-blur-md border-2 border-amber-400/80 rounded-2xl px-5 py-3 shadow-2xl flex items-center space-x-3 animate-bounce">
        <span className="text-3xl">👆</span>
        <div className="text-left">
          <p className="text-amber-300 font-black text-base sm:text-lg drop-shadow">
            แตะแล้วลากนิ้ว
          </p>
          <p className="text-zinc-200 text-xs sm:text-sm font-semibold">
            เพื่อบังคับราชาเดินไปตีป้อม
          </p>
        </div>
      </div>
    </div>
  );
};
