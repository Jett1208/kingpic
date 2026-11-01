/**
 * GameEngine.ts
 * Core Game Loop, DPR-aware Canvas scaling, Camera smoothing,
 * World rendering, Entity orchestration, and 100% win evaluation.
 */

import { spriteCache } from './SpriteCache';
import { InputManager } from './InputManager';
import { SoundEngine, soundEngine } from './SoundEngine';
import { Squad } from '../entities/Squad';
import { Destructible, Arrow, SoldierCage, BossTower } from '../entities/Destructible';
import { ParticleSystem } from '../entities/ParticleSystem';
import { StageGenerator, type StageData } from '../systems/StageGenerator';

export interface GameEngineCallbacks {
  onStateUpdate: (coins: number, elapsedTime: number, percent: number, soldiers: number) => void;
  onStageWin: (stars: number, elapsedTime: number, coins: number, percent: number) => void;
  onTutorialMove?: () => void;
}

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private input: InputManager;
  private sound: SoundEngine;
  private particles: ParticleSystem;

  public squad!: Squad;
  private destructibles: Destructible[] = [];
  private arrows: Arrow[] = [];
  private totalDestructibles = 0;
  private destroyedCount = 0;

  public stageNumber = 1;
  public parTime = 60;
  public elapsedTime = 0;
  public isRunning = false;
  public isPaused = false;
  private isStageCompleted = false;

  private animFrameId: number | null = null;
  private lastTime = 0;

  // Camera & World dimensions
  public cameraY = 300;
  public readonly worldWidth = 400;
  public readonly worldHeight = 900;
  public readonly logicalWidth = 360;
  public readonly logicalHeight = 640;

  private callbacks: GameEngineCallbacks;

  constructor(canvas: HTMLCanvasElement, callbacks: GameEngineCallbacks) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false }) as CanvasRenderingContext2D;
    this.ctx.imageSmoothingEnabled = false;

    this.input = new InputManager();
    this.sound = soundEngine;
    this.particles = new ParticleSystem();
    this.callbacks = callbacks;

    this.input.onFirstMove = () => {
      this.callbacks.onTutorialMove?.();
    };

    this.resizeCanvas();
    window.addEventListener('resize', this.handleResize);
  }

  private handleResize = () => {
    this.resizeCanvas();
  };

  public resizeCanvas(): void {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.parentElement?.getBoundingClientRect() || this.canvas.getBoundingClientRect();
    const w = rect.width || window.innerWidth;
    const h = rect.height || window.innerHeight;

    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;

    this.ctx.resetTransform();
    this.ctx.scale(dpr, dpr);
    this.ctx.imageSmoothingEnabled = false;
  }

  public loadStage(stageNumber: number): void {
    this.stageNumber = stageNumber;
    this.elapsedTime = 0;
    this.destroyedCount = 0;
    this.arrows = [];
    this.particles.clear();
    this.isStageCompleted = false;

    const stageData: StageData = StageGenerator.generateStage(stageNumber);
    this.parTime = stageData.parTime;
    this.totalDestructibles = stageData.totalDestructibles;
    this.destructibles = stageData.destructibles;

    this.squad = new Squad(stageData.kingSpawn.x, stageData.kingSpawn.y);
    this.cameraY = Math.max(0, this.squad.kingY - this.logicalHeight / 2);

    this.callbacks.onStateUpdate(0, 0, 0, 0);
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.isPaused = false;
    this.input.attach(this.canvas);
    this.sound.startBGM();
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  public stop(): void {
    this.isRunning = false;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    this.input.detach();
    this.sound.stopBGM();
  }

  public pause(): void {
    this.isPaused = true;
    this.sound.stopBGM();
  }

  public resume(): void {
    if (!this.isRunning) {
      this.start();
      return;
    }
    this.isPaused = false;
    this.lastTime = performance.now();
    this.sound.startBGM();
  }

  public destroy(): void {
    this.stop();
    window.removeEventListener('resize', this.handleResize);
  }

  private loop = (time: number) => {
    if (!this.isRunning) return;

    const rawDt = (time - this.lastTime) / 1000;
    this.lastTime = time;

    // Cap delta time to 50ms to prevent huge jumps when inactive
    const dt = Math.min(rawDt, 0.05);

    if (!this.isPaused && !this.isStageCompleted) {
      this.update(dt);
    }

    this.render();

    this.animFrameId = requestAnimationFrame(this.loop);
  };

  private update(dt: number): void {
    this.elapsedTime += dt;

    const inputDir = this.input.getDirection();

    // 1. Update Squad (King & Soldiers)
    this.squad.update(
      dt,
      inputDir,
      this.destructibles,
      this.particles,
      (killedEntity) => this.handleDestructibleKill(killedEntity)
    );

    // 2. Camera Lerp (Smooth Vertical follow)
    const targetCameraY = this.squad.kingY - this.logicalHeight / 2;
    this.cameraY += (targetCameraY - this.cameraY) * Math.min(1.0, 5.0 * dt);
    // Clamp camera within world bounds
    this.cameraY = Math.max(0, Math.min(this.worldHeight - this.logicalHeight, this.cameraY));

    // 3. Update Destructibles & Enemies
    const kingPos = { x: this.squad.kingX, y: this.squad.kingY };
    for (const d of this.destructibles) {
      if (d.alive) {
        d.update(dt, kingPos, (fromX, fromY) => {
          this.squad.applyKnockback(fromX, fromY);
        }, this.arrows);
      }
    }

    // 4. Update Arrows
    for (let i = this.arrows.length - 1; i >= 0; i--) {
      const a = this.arrows[i];
      a.update(dt, kingPos, (fromX, fromY) => {
        this.squad.applyKnockback(fromX, fromY);
      }, this.particles);
      if (!a.alive) {
        this.arrows.splice(i, 1);
      }
    }

    // 5. Update Particles
    this.particles.update(dt);

    // 6. Push UI state update
    const destructionPercent = Math.min(
      100,
      Math.round((this.destroyedCount / this.totalDestructibles) * 100)
    );
    this.callbacks.onStateUpdate(
      this.squad.stackedCoins,
      this.elapsedTime,
      destructionPercent,
      this.squad.soldiers.length
    );
  }

  private handleDestructibleKill(d: Destructible): void {
    this.destroyedCount++;

    // Release soldiers if cage
    if (d instanceof SoldierCage) {
      this.squad.addSoldiers(d.soldiersToFree);
    }

    // Spawn flying coins to King's coin tower
    if (d.coinReward > 0) {
      this.squad.addCoins(d.coinReward);
      this.particles.spawnCoinFly(
        d.x,
        d.y,
        () => ({ x: this.squad.kingX, y: this.squad.kingY - 20 }),
        Math.min(12, Math.max(3, Math.ceil(d.coinReward / 3)))
      );
    }

    // Check Boss Kill (Triggers Stage Victory)
    if (d instanceof BossTower && !this.isStageCompleted) {
      this.triggerStageWin();
    }
  }

  private triggerStageWin(): void {
    this.isStageCompleted = true;
    this.sound.stopBGM();

    const destructionPercent = Math.min(
      100,
      Math.round((this.destroyedCount / this.totalDestructibles) * 100)
    );

    // Calculate 3-star rating:
    // Star 1 = Beat boss (always true on win)
    // Star 2 = 100% total destruction
    // Star 3 = Under par time
    let stars = 1;
    if (destructionPercent >= 100) stars++;
    if (this.elapsedTime <= this.parTime) stars++;

    // Slight delay before opening summary modal for satisfaction
    setTimeout(() => {
      this.callbacks.onStageWin(
        stars,
        this.elapsedTime,
        this.squad.stackedCoins,
        destructionPercent
      );
    }, 1200);
  }

  private render(): void {
    const rect = this.canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    // Clear background
    this.ctx.fillStyle = '#14532d';
    this.ctx.fillRect(0, 0, width, height);

    this.ctx.save();

    // Scale & center world inside screen
    const scale = Math.min(width / this.logicalWidth, height / this.logicalHeight);
    const offsetX = (width - this.logicalWidth * scale) / 2;
    const offsetY = (height - this.logicalHeight * scale) / 2;

    this.ctx.translate(offsetX, offsetY);
    this.ctx.scale(scale, scale);

    // Clip to logical game viewport
    this.ctx.beginPath();
    this.ctx.rect(0, 0, this.logicalWidth, this.logicalHeight);
    this.ctx.clip();

    // Center the 400px world within the 360px viewport
    const worldOffsetX = (this.logicalWidth - this.worldWidth) / 2;
    this.ctx.translate(worldOffsetX, 0);

    // 1. Draw Ground (Checkerboard tiles)
    const tileSize = 32;
    const startTileY = Math.floor(this.cameraY / tileSize);
    const endTileY = Math.min(
      Math.ceil(this.worldHeight / tileSize),
      Math.ceil((this.cameraY + this.logicalHeight) / tileSize) + 1
    );

    for (let ty = startTileY; ty < endTileY; ty++) {
      for (let tx = 0; tx < Math.ceil(this.worldWidth / tileSize); tx++) {
        const isTileA = (tx + ty) % 2 === 0;
        const tileSprite = isTileA ? spriteCache.groundTileA : spriteCache.groundTileB;
        this.ctx.drawImage(tileSprite, tx * tileSize, ty * tileSize - this.cameraY, tileSize, tileSize);
      }
    }

    // 2. Draw Top Castle Wall decoration (Y = 0..32)
    const topRenderY = 0 - this.cameraY;
    this.ctx.fillStyle = '#0f172a';
    this.ctx.fillRect(0, topRenderY, this.worldWidth, 16);
    this.ctx.fillStyle = '#334155';
    for (let wx = 0; wx < this.worldWidth; wx += 24) {
      this.ctx.fillRect(wx, topRenderY, 16, 14);
    }

    // 3. Draw Bottom Wooden Gate decoration (Y = 884..900)
    const botRenderY = this.worldHeight - 16 - this.cameraY;
    this.ctx.fillStyle = '#78350f';
    this.ctx.fillRect(0, botRenderY, this.worldWidth, 16);

    // 4. Draw Destructibles
    for (const d of this.destructibles) {
      if (d.alive) {
        d.draw(this.ctx, this.cameraY);
      }
    }

    // 5. Draw Arrows
    for (const a of this.arrows) {
      a.draw(this.ctx, this.cameraY);
    }

    // 6. Draw Squad (King, Soldiers & Coin Tower)
    if (this.squad) {
      this.squad.draw(this.ctx, this.cameraY);
    }

    // 7. Draw Particles (Damage numbers, sparks, flying coins)
    this.particles.draw(this.ctx, this.cameraY);

    this.ctx.restore();

    // 8. Render Floating Touch Joystick overlay (in screen coordinates)
    this.input.render(this.ctx);
  }
}
