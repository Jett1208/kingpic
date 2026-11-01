import React from 'react';
import { ArrowLeft, Star, Lock } from 'lucide-react';
import { useGameStore } from '../systems/useGameStore';

export const StageSelect: React.FC = () => {
  const { highestUnlocked, stages, startStage, setScreen } = useGameStore();

  // Show unlocked stages + 1 locked stage
  const displayCount = highestUnlocked;

  return (
    <div className="absolute inset-0 z-30 flex flex-col bg-gradient-to-b from-green-950 via-green-900 to-emerald-950 text-white select-none">
      {/* Top Bar with Back Button */}
      <div className="flex items-center justify-between p-4 border-b border-emerald-800/60 bg-emerald-950/80 backdrop-blur-sm">
        <button
          onClick={() => setScreen('menu')}
          className="flex items-center space-x-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 active:scale-95 border-2 border-zinc-600 rounded-xl font-bold text-white transition-all cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>ย้อนกลับ</span>
        </button>
        <h2 className="text-xl font-black text-amber-300 drop-shadow">เลือกด่าน</h2>
        <div className="w-20" /> {/* Spacer for balance */}
      </div>

      {/* Grid of Stages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-4 gap-3 max-w-sm mx-auto">
          {Array.from({ length: displayCount }, (_, idx) => {
            const stageNum = idx + 1;
            const record = stages[stageNum];
            const stars = record?.stars || 0;

            return (
              <button
                key={stageNum}
                onClick={() => startStage(stageNum)}
                className="aspect-square bg-gradient-to-b from-emerald-600 to-green-700 hover:from-emerald-500 hover:to-green-600 active:scale-95 border-2 border-emerald-400 rounded-2xl flex flex-col items-center justify-center p-2 shadow-lg transition-all cursor-pointer"
              >
                <span className="text-xl font-black text-white">{stageNum}</span>
                {/* 3 Stars indicator */}
                <div className="flex space-x-0.5 mt-1">
                  {[1, 2, 3].map((starIdx) => (
                    <Star
                      key={starIdx}
                      className={`w-3.5 h-3.5 ${
                        starIdx <= stars
                          ? 'text-amber-300 fill-amber-300'
                          : 'text-emerald-900 fill-emerald-900'
                      }`}
                    />
                  ))}
                </div>
              </button>
            );
          })}

          {/* Locked Stage Preview */}
          <div className="aspect-square bg-zinc-800/70 border-2 border-zinc-700 rounded-2xl flex flex-col items-center justify-center p-2 text-zinc-500 opacity-70">
            <Lock className="w-6 h-6 mb-1 text-zinc-400" />
            <span className="text-sm font-bold">{displayCount + 1}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
