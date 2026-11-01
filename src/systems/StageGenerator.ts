/**
 * StageGenerator.ts
 * Deterministic level generator using Mulberry32 seeded PRNG.
 * Generates rich, dense Arcade-style levels (35–45 destructibles) with
 * fence barricades, multiple soldier cages, enemy packs, and coin clusters.
 */

import {
  Destructible,
  Fence,
  CoinPile,
  SoldierCage,
  RedMonster,
  ArcherTower,
  BossTower,
} from '../entities/Destructible';

export interface StageData {
  stageNumber: number;
  parTime: number;
  kingSpawn: { x: number; y: number };
  destructibles: Destructible[];
  totalDestructibles: number;
}

/**
 * 32-bit Mulberry PRNG
 */
export function mulberry32(seed: number): () => number {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class StageGenerator {
  public static generateStage(stageNumber: number): StageData {
    const rng = mulberry32(stageNumber * 9973);

    const parTime = 45 + Math.min(60, stageNumber * 5);
    const kingSpawn = { x: 200, y: 820 };

    const destructibles: Destructible[] = [];

    // Helper to check distance
    const isTooClose = (x: number, y: number, minDist = 34): boolean => {
      if (Math.hypot(x - kingSpawn.x, y - kingSpawn.y) < 45) return true;
      for (const d of destructibles) {
        if (Math.hypot(x - d.x, y - d.y) < minDist) return true;
      }
      return false;
    };

    const getRandomPosInZone = (
      minY: number,
      maxY: number,
      minX = 40,
      maxX = 360,
      minDist = 34
    ): { x: number; y: number } => {
      let tries = 0;
      while (tries < 40) {
        const x = Math.floor(minX + rng() * (maxX - minX));
        const y = Math.floor(minY + rng() * (maxY - minY));
        if (!isTooClose(x, y, minDist)) {
          return { x, y };
        }
        tries++;
      }
      return {
        x: Math.floor(minX + rng() * (maxX - minX)),
        y: Math.floor(minY + rng() * (maxY - minY)),
      };
    };

    // ==========================================
    // 1. SPAWN ZONE (Y: 660 - 850)
    // ==========================================
    // FIRST CAGE right above king spawn (walk 1 second to rescue +3 soldiers!)
    destructibles.push(new SoldierCage(200, 730, stageNumber));

    // Instant gratification horizontal fence row (Y ~ 770)
    const fenceRowX = [80, 120, 160, 240, 280, 320];
    for (const fx of fenceRowX) {
      destructibles.push(new Fence(fx, 770));
    }

    // Free coins near spawn
    destructibles.push(new CoinPile(130, 810, 15));
    destructibles.push(new CoinPile(270, 810, 15));
    destructibles.push(new CoinPile(120, 710, 20));
    destructibles.push(new CoinPile(280, 710, 20));

    // ==========================================
    // 2. MID ZONE (Y: 260 - 640) - High Density
    // ==========================================
    // 3 to 5 more Soldier Cages (Total 4 to 6 cages per map!)
    const midCageCount = 3 + Math.min(2, Math.floor(stageNumber / 2));
    for (let i = 0; i < midCageCount; i++) {
      const pos = getRandomPosInZone(280, 620, 50, 350, 48);
      destructibles.push(new SoldierCage(pos.x, pos.y, stageNumber));
    }

    // Red Monsters (3 to 6)
    const monsterCount = 3 + Math.min(3, Math.floor(stageNumber / 2));
    for (let i = 0; i < monsterCount; i++) {
      const pos = getRandomPosInZone(300, 600, 50, 350, 45);
      destructibles.push(new RedMonster(pos.x, pos.y, stageNumber));
    }

    // Mid-zone Fence Barricades (2 lines to plow through)
    const midFenceX1 = [60, 100, 140, 260, 300, 340];
    for (const fx of midFenceX1) {
      destructibles.push(new Fence(fx, 500));
    }
    const midFenceX2 = [80, 120, 200, 280, 320];
    for (const fx of midFenceX2) {
      destructibles.push(new Fence(fx, 360));
    }

    // Additional scattered fences
    for (let i = 0; i < 4; i++) {
      const pos = getRandomPosInZone(300, 620, 50, 350, 35);
      destructibles.push(new Fence(pos.x, pos.y));
    }

    // Mid-zone Coin clusters
    for (let i = 0; i < 6; i++) {
      const pos = getRandomPosInZone(280, 620, 50, 350, 35);
      const coins = 15 + Math.floor(rng() * 11);
      destructibles.push(new CoinPile(pos.x, pos.y, coins));
    }

    // ==========================================
    // 3. BOSS ZONE (Y: 50 - 250)
    // ==========================================
    // Boss Tower dead center
    const boss = new BossTower(200, 110, stageNumber);
    destructibles.push(boss);

    // Flanking Archer Towers (2 + floor(S/4))
    const archerCount = 2 + Math.floor(stageNumber / 4);
    destructibles.push(new ArcherTower(85, 120, stageNumber));
    destructibles.push(new ArcherTower(315, 120, stageNumber));
    for (let i = 2; i < archerCount; i++) {
      const pos = getRandomPosInZone(150, 220, 60, 340, 45);
      destructibles.push(new ArcherTower(pos.x, pos.y, stageNumber));
    }

    // Defensive fence row protecting the Boss
    const bossFenceX = [120, 160, 240, 280];
    for (const fx of bossFenceX) {
      destructibles.push(new Fence(fx, 200));
    }

    // Boss victory treasure coin piles
    destructibles.push(new CoinPile(200, 50, 35));
    destructibles.push(new CoinPile(150, 60, 25));
    destructibles.push(new CoinPile(250, 60, 25));

    return {
      stageNumber,
      parTime,
      kingSpawn,
      destructibles,
      totalDestructibles: destructibles.length,
    };
  }
}
