/**
 * useGameStore.ts
 * Zustand store with localStorage persistence for saved progress,
 * best stars per stage, sound/haptic preferences, and active gameplay state.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { soundEngine } from '../core/SoundEngine';

export type GameScreen = 'menu' | 'stageSelect' | 'playing' | 'paused' | 'summary';

export interface StageRecord {
  stars: number;
  bestTime: number;
  bestCoins: number;
  bestPercent: number;
}

export interface GameState {
  // Persistent Storage
  version: number;
  highestUnlocked: number;
  stages: Record<number, StageRecord>;
  soundOn: boolean;
  hapticOn: boolean;
  tutorialSeen: boolean;

  // Transient Gameplay State
  screen: GameScreen;
  currentStage: number;
  coins: number;
  elapsedTime: number;
  destructionPercent: number;
  soldiersCount: number;
  lastStarsEarned: number;

  // Actions
  setScreen: (screen: GameScreen) => void;
  startStage: (stageNumber: number) => void;
  updateGameState: (coins: number, time: number, percent: number, soldiers: number) => void;
  completeStage: (stars: number, time: number, coins: number, percent: number) => void;
  toggleSound: () => void;
  toggleHaptic: () => void;
  markTutorialSeen: () => void;
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      // Persistent initial state
      version: 1,
      highestUnlocked: 1,
      stages: {},
      soundOn: true,
      hapticOn: true,
      tutorialSeen: false,

      // Transient initial state
      screen: 'menu',
      currentStage: 1,
      coins: 0,
      elapsedTime: 0,
      destructionPercent: 0,
      soldiersCount: 0,
      lastStarsEarned: 1,

      setScreen: (screen) => set({ screen }),

      startStage: (stageNumber) => {
        set({
          screen: 'playing',
          currentStage: stageNumber,
          coins: 0,
          elapsedTime: 0,
          destructionPercent: 0,
          soldiersCount: 0,
        });
      },

      updateGameState: (coins, time, percent, soldiers) => {
        set({
          coins,
          elapsedTime: time,
          destructionPercent: percent,
          soldiersCount: soldiers,
        });
      },

      completeStage: (stars, time, coins, percent) => {
        const state = get();
        const stageNum = state.currentStage;
        const currentRecord = state.stages[stageNum];

        const newRecord: StageRecord = {
          stars: Math.max(stars, currentRecord?.stars || 0),
          bestTime: currentRecord ? Math.min(time, currentRecord.bestTime) : time,
          bestCoins: Math.max(coins, currentRecord?.bestCoins || 0),
          bestPercent: Math.max(percent, currentRecord?.bestPercent || 0),
        };

        const newHighest = Math.max(state.highestUnlocked, stageNum + 1);

        set({
          screen: 'summary',
          lastStarsEarned: stars,
          highestUnlocked: newHighest,
          stages: {
            ...state.stages,
            [stageNum]: newRecord,
          },
        });
      },

      toggleSound: () => {
        const next = !get().soundOn;
        soundEngine.setMuted(!next);
        set({ soundOn: next });
      },

      toggleHaptic: () => {
        const next = !get().hapticOn;
        soundEngine.setHapticEnabled(next);
        set({ hapticOn: next });
      },

      markTutorialSeen: () => {
        set({ tutorialSeen: true });
      },
    }),
    {
      name: 'agong-kingshot-save',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        version: state.version,
        highestUnlocked: state.highestUnlocked,
        stages: state.stages,
        soundOn: state.soundOn,
        hapticOn: state.hapticOn,
        tutorialSeen: state.tutorialSeen,
      }),
    }
  )
);
