/**
 * ParticleSystem.ts
 * Manages Bezier flying coins, bouncy damage popups, wood debris, and hit sparks.
 */

import { spriteCache } from '../core/SpriteCache';

export interface Particle {
  update(dt: number): boolean; // returns false if expired
  draw(ctx: CanvasRenderingContext2D, cameraY: number): void;
}

export class CoinFlyParticle implements Particle {
  private progress = 0;
  private duration = 0.55; // seconds
  private p0: { x: number; y: number };
  private p1: { x: number; y: number };
  private getTarget: () => { x: number; y: number };

  constructor(fromX: number, fromY: number, getTarget: () => { x: number; y: number }) {
    this.p0 = { x: fromX, y: fromY };
    this.getTarget = getTarget;

    // Control point for quadratic curve (flings upward then curves into king's head)
    const arcHeight = 60 + Math.random() * 40;
    const midX = fromX + (Math.random() * 80 - 40);
    this.p1 = { x: midX, y: fromY - arcHeight };
  }

  public update(dt: number): boolean {
    this.progress += dt / this.duration;
    return this.progress < 1.0;
  }

  public draw(ctx: CanvasRenderingContext2D, cameraY: number): void {
    const t = Math.min(1.0, this.progress);
    const target = this.getTarget();

    // Quadratic Bezier: B(t) = (1-t)^2 * P0 + 2(1-t)t * P1 + t^2 * P2
    const oneMinusT = 1 - t;
    const x = oneMinusT * oneMinusT * this.p0.x + 2 * oneMinusT * t * this.p1.x + t * t * target.x;
    const y = oneMinusT * oneMinusT * this.p0.y + 2 * oneMinusT * t * this.p1.y + t * t * target.y;

    const renderY = y - cameraY;
    ctx.drawImage(spriteCache.coin, x - 8, renderY - 8, 16, 16);
  }
}

export class DamageNumberParticle implements Particle {
  private x: number;
  private y: number;
  private amount: number;
  private elapsed = 0;
  private duration = 0.75;

  constructor(x: number, y: number, amount: number) {
    this.x = x + (Math.random() * 16 - 8);
    this.y = y - 10;
    this.amount = amount;
  }

  public update(dt: number): boolean {
    this.elapsed += dt;
    this.y -= 45 * dt; // Float upward
    return this.elapsed < this.duration;
  }

  public draw(ctx: CanvasRenderingContext2D, cameraY: number): void {
    const alpha = Math.max(0, 1 - this.elapsed / this.duration);
    const renderY = this.y - cameraY;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';

    // Stroke
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#000000';
    ctx.strokeText(`-${this.amount}`, this.x, renderY);

    // Fill
    ctx.fillStyle = '#fef08a'; // Bright yellow
    ctx.fillText(`-${this.amount}`, this.x, renderY);

    ctx.restore();
  }
}

export class WoodDebrisParticle implements Particle {
  private x: number;
  private y: number;
  private vx: number;
  private vy: number;
  private size: number;
  private color: string;
  private elapsed = 0;
  private duration = 0.5;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    const angle = Math.random() * Math.PI * 2;
    const speed = 40 + Math.random() * 80;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed - 40; // upward bias
    this.size = 3 + Math.random() * 3;
    this.color = Math.random() > 0.5 ? '#92400e' : '#b45309';
  }

  public update(dt: number): boolean {
    this.elapsed += dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vy += 220 * dt; // Gravity
    return this.elapsed < this.duration;
  }

  public draw(ctx: CanvasRenderingContext2D, cameraY: number): void {
    const alpha = Math.max(0, 1 - this.elapsed / this.duration);
    const renderY = this.y - cameraY;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x - this.size / 2, renderY - this.size / 2, this.size, this.size);
    ctx.restore();
  }
}

export class SparkParticle implements Particle {
  private x: number;
  private y: number;
  private vx: number;
  private vy: number;
  private elapsed = 0;
  private duration = 0.3;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    const angle = Math.random() * Math.PI * 2;
    const speed = 60 + Math.random() * 100;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
  }

  public update(dt: number): boolean {
    this.elapsed += dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    return this.elapsed < this.duration;
  }

  public draw(ctx: CanvasRenderingContext2D, cameraY: number): void {
    const alpha = Math.max(0, 1 - this.elapsed / this.duration);
    const renderY = this.y - cameraY;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(this.x - 2, renderY - 2, 4, 4);
    ctx.restore();
  }
}

export class ParticleSystem {
  private particles: Particle[] = [];

  public update(dt: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const alive = this.particles[i].update(dt);
      if (!alive) {
        this.particles.splice(i, 1);
      }
    }
  }

  public draw(ctx: CanvasRenderingContext2D, cameraY: number): void {
    for (const p of this.particles) {
      p.draw(ctx, cameraY);
    }
  }

  public clear(): void {
    this.particles = [];
  }

  public spawnCoinFly(fromX: number, fromY: number, getTarget: () => { x: number; y: number }, count = 1): void {
    for (let i = 0; i < count; i++) {
      this.particles.push(new CoinFlyParticle(fromX, fromY, getTarget));
    }
  }

  public spawnDamageNumber(x: number, y: number, amount: number): void {
    this.particles.push(new DamageNumberParticle(x, y, amount));
  }

  public spawnWoodDebris(x: number, y: number, count = 5): void {
    for (let i = 0; i < count; i++) {
      this.particles.push(new WoodDebrisParticle(x, y));
    }
  }

  public spawnSpark(x: number, y: number, count = 6): void {
    for (let i = 0; i < count; i++) {
      this.particles.push(new SparkParticle(x, y));
    }
  }
}
