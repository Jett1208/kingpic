import React from 'react';
import { Pause, Volume2, VolumeX, Coins, Users } from 'lucide-react';
import { useGameStore } from '../systems/useGameStore';

export const HUD: React.FC = () => {
  const {
    currentStage,
    destructionPercent,
    elapsedTime,
    coins,
    soldiersCount,
    soundOn,
    toggleSound,
    setScreen,
  } = useGameStore();

  const formatTime = (secs: number): string => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="absolute inset-0 z-20 pointer-events-none flex flex-col justify-between p-3 select-none">
      {/* Top Status Bar */}
      <div className="flex items-center justify-between w-full max-w-md mx-auto bg-black/60 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10 shadow-lg">
        {/* Left: Stage, Destruction %, Time */}
        <div className="flex items-center space-x-3 text-white font-black text-base sm:text-lg">
          <span className="text-amber-300 drop-shadow">🏰 ด่าน {currentStage}</span>
          <span className="text-emerald-400 drop-shadow">⚔️ {destructionPercent}%</span>
          <span className="text-zinc-300 font-mono drop-shadow">⏱ {formatTime(elapsedTime)}</span>
        </div>

        {/* Right: Audio & Pause Buttons */}
        <div className="flex items-center space-x-2 pointer-events-auto">
          <button
            onClick={toggleSound}
            className="w-10 h-10 bg-zinc-800/90 active:scale-90 border border-zinc-600 rounded-xl flex items-center justify-center text-white transition-all cursor-pointer shadow"
            title="เปิด/ปิดเสียง"
          >
            {soundOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5 text-zinc-400" />}
          </button>

          <button
            onClick={() => setScreen('paused')}
            className="w-10 h-10 bg-amber-600 active:scale-90 border border-amber-400 rounded-xl flex items-center justify-center text-white transition-all cursor-pointer shadow"
            title="หยุดพัก"
          >
            <Pause className="w-5 h-5 fill-current" />
          </button>
        </div>
      </div>

      {/* Bottom Info: Coins & Soldiers Count */}
      <div className="flex items-center justify-between w-full max-w-md mx-auto mb-2 px-2">
        <div className="flex items-center space-x-2 bg-black/60 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-amber-400/40 text-amber-300 font-black text-lg shadow-lg">
          <Coins className="w-6 h-6 text-amber-400 fill-amber-400" />
          <span>{coins}</span>
        </div>

        {soldiersCount > 0 && (
          <div className="flex items-center space-x-2 bg-black/60 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-blue-400/40 text-blue-300 font-black text-lg shadow-lg">
            <Users className="w-6 h-6 text-blue-400" />
            <span>+{soldiersCount} ทหาร</span>
          </div>
        )}
      </div>
    </div>
  );
};
