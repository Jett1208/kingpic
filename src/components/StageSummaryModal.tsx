import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Play, RotateCcw, ListOrdered, Home, Star, Coins, Clock, Target } from 'lucide-react';
import { useGameStore } from '../systems/useGameStore';
import { soundEngine } from '../core/SoundEngine';

export const StageSummaryModal: React.FC = () => {
  const {
    currentStage,
    coins,
    elapsedTime,
    destructionPercent,
    lastStarsEarned,
    startStage,
    setScreen,
  } = useGameStore();

  const [visibleStars, setVisibleStars] = useState(0);

  useEffect(() => {
    // 1. Confetti burst
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {
      // Ignore if confetti fails in test env
    }

    // 2. Animate stars 1 by 1
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    for (let i = 1; i <= lastStarsEarned; i++) {
      const t = setTimeout(() => {
        setVisibleStars(i);
        soundEngine.playStarDing(i);
        soundEngine.vibrateLight();
      }, 400 * i);
      timeouts.push(t);
    }

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [lastStarsEarned]);

  const formatTime = (secs: number): string => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md text-white select-none">
      <div className="w-full max-w-sm bg-gradient-to-b from-zinc-900 to-green-950 border-4 border-amber-400/80 rounded-3xl p-6 shadow-2xl flex flex-col items-center space-y-4 animate-in fade-in zoom-in-95 duration-300">
        {/* Title */}
        <div className="text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
            ชัยชนะสมบูรณ์แบบ
          </span>
          <h2 className="text-3xl font-black text-amber-300 drop-shadow">
            ✨ ผ่านด่าน {currentStage} ✨
          </h2>
        </div>

        {/* 3 Stars display */}
        <div className="flex items-center space-x-3 py-2">
          {[1, 2, 3].map((starIdx) => {
            const isEarned = starIdx <= visibleStars;
            return (
              <div
                key={starIdx}
                className={`transition-all duration-300 transform ${
                  isEarned ? 'scale-110' : 'scale-90 opacity-40'
                }`}
              >
                <Star
                  className={`w-12 h-12 ${
                    isEarned
                      ? 'text-amber-300 fill-amber-300 drop-shadow-[0_0_12px_rgba(251,191,36,0.8)]'
                      : 'text-zinc-600 fill-zinc-700'
                  }`}
                />
              </div>
            );
          })}
        </div>

        {/* Stats card */}
        <div className="w-full bg-black/40 border border-white/10 rounded-2xl p-3.5 space-y-2 text-sm font-bold">
          <div className="flex items-center justify-between text-amber-300">
            <span className="flex items-center space-x-2">
              <Coins className="w-4 h-4 fill-current" />
              <span>เหรียญที่เก็บได้:</span>
            </span>
            <span className="font-mono text-base font-black">+{coins}</span>
          </div>

          <div className="flex items-center justify-between text-zinc-300">
            <span className="flex items-center space-x-2">
              <Clock className="w-4 h-4" />
              <span>เวลาที่ใช้:</span>
            </span>
            <span className="font-mono text-base">{formatTime(elapsedTime)}</span>
          </div>

          <div className="flex items-center justify-between text-emerald-300">
            <span className="flex items-center space-x-2">
              <Target className="w-4 h-4" />
              <span>การทำลายล้าง:</span>
            </span>
            <span className="font-mono text-base">{destructionPercent}%</span>
          </div>
        </div>

        {/* 4 Extra-Large Thai Action Buttons for Elderly */}
        <div className="w-full space-y-2.5 pt-1">
          {/* 1. Next Stage (Primary large green button) */}
          <button
            onClick={() => startStage(currentStage + 1)}
            className="w-full h-15 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 active:scale-95 border-b-4 border-green-800 rounded-2xl flex items-center justify-center space-x-3 text-xl font-black text-white shadow-xl shadow-green-950/60 transition-all cursor-pointer"
          >
            <Play className="w-7 h-7 fill-current" />
            <span>ด่านต่อไป</span>
          </button>

          {/* 2. Replay Stage */}
          <button
            onClick={() => startStage(currentStage)}
            className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-95 border-b-4 border-indigo-900 rounded-2xl flex items-center justify-center space-x-2 text-base font-bold text-white transition-all cursor-pointer"
          >
            <RotateCcw className="w-5 h-5" />
            <span>เล่นซ้ำอีกรอบ</span>
          </button>

          {/* 3. Stage Select */}
          <button
            onClick={() => setScreen('stageSelect')}
            className="w-full h-11 bg-zinc-800 hover:bg-zinc-700 active:scale-95 border border-zinc-600 rounded-2xl flex items-center justify-center space-x-2 text-sm font-bold text-zinc-200 transition-all cursor-pointer"
          >
            <ListOrdered className="w-5 h-5" />
            <span>เลือกด่าน</span>
          </button>

          {/* 4. Main Menu */}
          <button
            onClick={() => setScreen('menu')}
            className="w-full h-11 bg-zinc-800 hover:bg-zinc-700 active:scale-95 border border-zinc-600 rounded-2xl flex items-center justify-center space-x-2 text-sm font-bold text-zinc-300 transition-all cursor-pointer"
          >
            <Home className="w-5 h-5" />
            <span>กลับหน้าหลัก</span>
          </button>
        </div>
      </div>
    </div>
  );
};
