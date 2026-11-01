import React from 'react';
import { Play, ListOrdered, Volume2, VolumeX, Vibrate, VibrateOff, Crown } from 'lucide-react';
import { useGameStore } from '../systems/useGameStore';

export const MainMenu: React.FC = () => {
  const {
    highestUnlocked,
    soundOn,
    hapticOn,
    startStage,
    setScreen,
    toggleSound,
    toggleHaptic,
  } = useGameStore();

  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-between p-6 bg-gradient-to-b from-green-950 via-green-900 to-emerald-950 text-white select-none">
      {/* Top Header / Title */}
      <div className="flex flex-col items-center mt-8 space-y-3">
        <div className="w-24 h-24 rounded-3xl bg-amber-500/20 border-4 border-amber-400 flex items-center justify-center shadow-2xl shadow-amber-500/40 animate-pulse">
          <Crown className="w-14 h-14 text-amber-300 drop-shadow" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-wide text-amber-300 drop-shadow-md text-center">
          👑 เกมตีป้อมของอากง
        </h1>
        <p className="text-emerald-200 text-sm font-semibold tracking-wider uppercase">
          Kingshot 2D Pixel Edition
        </p>
      </div>

      {/* Middle Action Buttons (Extra-Large for Elderly) */}
      <div className="w-full max-w-xs space-y-4 my-auto">
        <button
          onClick={() => startStage(highestUnlocked)}
          className="w-full h-16 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 active:scale-95 border-b-4 border-green-800 rounded-2xl flex items-center justify-center space-x-3 text-xl font-bold text-white shadow-xl shadow-green-900/50 transition-all cursor-pointer"
        >
          <Play className="w-7 h-7 fill-current" />
          <span>เล่นด่าน {highestUnlocked}</span>
        </button>

        <button
          onClick={() => setScreen('stageSelect')}
          className="w-full h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-95 border-b-4 border-indigo-900 rounded-2xl flex items-center justify-center space-x-3 text-lg font-bold text-white shadow-lg transition-all cursor-pointer"
        >
          <ListOrdered className="w-6 h-6" />
          <span>เลือกด่าน</span>
        </button>
      </div>

      {/* Bottom Preferences (Audio & Haptics) */}
      <div className="flex items-center justify-center space-x-6 mb-4">
        <button
          onClick={toggleSound}
          className={`flex items-center space-x-2 px-4 py-3 rounded-xl font-semibold border-2 transition-all cursor-pointer ${
            soundOn
              ? 'bg-emerald-800/80 border-emerald-400 text-emerald-100 shadow-md'
              : 'bg-zinc-800 border-zinc-600 text-zinc-400'
          }`}
          title="เปิด/ปิดเสียง"
        >
          {soundOn ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
          <span>{soundOn ? 'เสียงเปิด' : 'เสียงปิด'}</span>
        </button>

        <button
          onClick={toggleHaptic}
          className={`flex items-center space-x-2 px-4 py-3 rounded-xl font-semibold border-2 transition-all cursor-pointer ${
            hapticOn
              ? 'bg-emerald-800/80 border-emerald-400 text-emerald-100 shadow-md'
              : 'bg-zinc-800 border-zinc-600 text-zinc-400'
          }`}
          title="เปิด/ปิดการสั่น"
        >
          {hapticOn ? <Vibrate className="w-6 h-6" /> : <VibrateOff className="w-6 h-6" />}
          <span>{hapticOn ? 'สั่นเปิด' : 'สั่นปิด'}</span>
        </button>
      </div>
    </div>
  );
};
