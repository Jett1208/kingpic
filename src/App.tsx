import React, { useEffect, useRef } from 'react';
import { GameEngine } from './core/GameEngine';
import { useGameStore } from './systems/useGameStore';
import { MainMenu } from './components/MainMenu';
import { StageSelect } from './components/StageSelect';
import { HUD } from './components/HUD';
import { PauseOverlay } from './components/PauseOverlay';
import { StageSummaryModal } from './components/StageSummaryModal';
import { TutorialOverlay } from './components/TutorialOverlay';

export const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  const {
    screen,
    currentStage,
    updateGameState,
    completeStage,
    markTutorialSeen,
    setScreen,
  } = useGameStore();

  // Initialize GameEngine once
  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new GameEngine(canvasRef.current, {
      onStateUpdate: (coins, time, percent, soldiers) => {
        updateGameState(coins, time, percent, soldiers);
      },
      onStageWin: (stars, time, coins, percent) => {
        completeStage(stars, time, coins, percent);
      },
      onTutorialMove: () => {
        markTutorialSeen();
      },
    });

    engineRef.current = engine;

    // Auto-pause when app is minimized or phone screen locks
    const handleVisibilityChange = () => {
      if (document.hidden && useGameStore.getState().screen === 'playing') {
        engine.pause();
        setScreen('paused');
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      engine.destroy();
      engineRef.current = null;
    };
  }, [completeStage, markTutorialSeen, setScreen, updateGameState]);

  // Handle stage and screen transitions
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;

    if (screen === 'playing') {
      if (engine.stageNumber !== currentStage || !engine.isRunning) {
        engine.loadStage(currentStage);
        engine.start();
      } else if (engine.isPaused) {
        engine.resume();
      }
    } else if (screen === 'paused') {
      engine.pause();
    } else if (screen === 'summary') {
      // Keep canvas frozen in background
    } else if (screen === 'menu' || screen === 'stageSelect') {
      engine.stop();
    }
  }, [screen, currentStage]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-green-950 flex items-center justify-center">
      {/* Game Canvas (Full Screen) */}
      <canvas
        ref={canvasRef}
        className="block w-full h-full touch-none select-none"
      />

      {/* Screen Overlays */}
      {screen === 'menu' && <MainMenu />}
      {screen === 'stageSelect' && <StageSelect />}

      {/* Gameplay HUD & Overlays */}
      {(screen === 'playing' || screen === 'paused' || screen === 'summary') && (
        <HUD />
      )}

      {screen === 'playing' && <TutorialOverlay />}
      {screen === 'paused' && <PauseOverlay />}
      {screen === 'summary' && <StageSummaryModal />}
    </div>
  );
};

export default App;
