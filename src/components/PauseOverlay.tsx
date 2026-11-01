import React from 'react';
import { Play, Home } from 'lucide-react';
import { useGameStore } from '../systems/useGameStore';

export const PauseOverlay: React.FC = () => {
  const { setScreen } = useGameStore();

  return (
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center p-6 bg-black/75 backdrop-blur-sm text-white select-none">
      <div className="w-full max-w-xs bg-zinc-900 border-2 border-zinc-700 rounded-3xl p-6 shadow-2xl flex flex-col items-center space-y-6">
        <h2 className="text-2xl font-black text-amber-300 drop-shadow flex items-center space-x-2">
          <span>⏸️</span>
          <span>หยุดพัก</span>
        </h2>

        <div className="w-full space-y-3">
          <button
            onClick={() => setScreen('playing')}
            className="w-full h-14 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 active:scale-95 border-b-4 border-green-800 rounded-2xl flex items-center justify-center space-x-3 text-lg font-bold text-white shadow-lg transition-all cursor-pointer"
          >
            <Play className="w-6 h-6 fill-current" />
            <span>เล่นต่อ</span>
          </button>

          <button
            onClick={() => setScreen('menu')}
            className="w-full h-12 bg-zinc-800 hover:bg-zinc-700 active:scale-95 border border-zinc-600 rounded-2xl flex items-center justify-center space-x-2 text-base font-bold text-zinc-300 transition-all cursor-pointer"
          >
            <Home className="w-5 h-5" />
            <span>กลับหน้าหลัก</span>
          </button>
        </div>
      </div>
    </div>
  );
};
