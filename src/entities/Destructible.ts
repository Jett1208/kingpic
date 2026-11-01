/**
 * Destructible.ts
 * OOP hierarchy for all interactive obstacles and enemies:
 * Fence, CoinPile, SoldierCage, RedMonster, ArcherTower, BossTower, and Arrow projectiles.
 */

import { spriteCache } from '../core/SpriteCache';
import { soundEngine } from '../core/SoundEngine';
import { ParticleSystem } from './ParticleSystem';

export type DestructibleType = 'fence' | 'coinPile' | 'cage' | 'redMonster' | 'archerTower' | 'bossTower';

export abstract class Destructible {
  public x: number;
  public y: number;
  public hp: number;
  public maxHp: number;
  public width: number;
  public height: number;
  public alive = true;
  public type: DestructibleType;
  public coinReward: number;

  constructor(x: number, y: number, hp: number, width: number, height: number, type: DestructibleType, coinReward: number) {
    this.x = x;
    this.y = y;
    this.hp = hp;
    this.maxHp = hp;
    this.width = width;
    this.height = height;
    this.type = type;
    this.coinReward = coinReward;
  }

  public takeDamage(amount: number, particles: ParticleSystem): boolean {
    if (!this.alive) return false;

    this.hp -= amount;
    particles.spawnDamageNumber(this.x, this.y, amount);
    particles.spawnSpark(this.x, this.y, 3);

    if (this.hp <= 0) {
      this.hp = 0;
      this.alive = false;
      this.onDeath(particles);
      return true; // Just died
    }
    return false;
  }

  protected abstract onDeath(particles: ParticleSystem): void;

  public update(
    _dt: number,
    _kingPos: { x: number; y: number },
    _onHitKing: (fromX: number, fromY: number) => void,
    _arrows: Arrow[]
  ): void {
    // Default static update
  }

  public draw(ctx: CanvasRenderingContext2D, cameraY: number): void {
    const renderY = this.y - cameraY;

    // Draw entity sprite centered
    this.drawSprite(ctx, this.x - this.width / 2, renderY - this.height / 2);

    // Draw HP bar if damaged and alive
    if (this.alive && this.hp < this.maxHp) {
      const barW = Math.max(24, this.width);
      const barH = 4;
      const barX = this.x - barW / 2;
      const barY = renderY - this.height / 2 - 8;

      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);

      const hpPercent = Math.max(0, this.hp / this.maxHp);
      ctx.fillStyle = hpPercent > 0.4 ? '#22c55e' : '#ef4444';
      ctx.fillRect(barX, barY, barW * hpPercent, barH);
    }
  }

  protected abstract drawSprite(ctx: CanvasRenderingContext2D, x: number, y: number): void;
}

// ------------------------------------------
// 1. FENCE
// ------------------------------------------
export class Fence extends Destructible {
  constructor(x: number, y: number) {
    super(x, y, 30, 32, 32, 'fence', 3);
  }

  protected onDeath(particles: ParticleSystem): void {
    soundEngine.playAttack();
    soundEngine.vibrateLight();
    particles.spawnWoodDebris(this.x, this.y, 6);
  }

  protected drawSprite(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    ctx.drawImage(spriteCache.fence, x, y, 32, 32);
  }
}

// ------------------------------------------
// 2. COIN PILE
// ------------------------------------------
export class CoinPile extends Destructible {
  constructor(x: number, y: number, reward = 20) {
    super(x, y, 20, 32, 32, 'coinPile', reward);
  }

  protected onDeath(particles: ParticleSystem): void {
    soundEngine.playCoin();
    soundEngine.vibrateLight();
    particles.spawnSpark(this.x, this.y, 8);
  }

  protected drawSprite(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    ctx.drawImage(spriteCache.coinPile, x, y, 32, 32);
  }
}

// ------------------------------------------
// 3. SOLDIER CAGE
// ------------------------------------------
export class SoldierCage extends Destructible {
  public soldiersToFree = 3;

  constructor(x: number, y: number, stage: number) {
    const hp = Math.round(80 * Math.pow(1.15, stage - 1));
    super(x, y, hp, 32, 32, 'cage', 10);
  }

  protected onDeath(particles: ParticleSystem): void {
    soundEngine.playCageBreak();
    soundEngine.vibrateMedium();
    particles.spawnWoodDebris(this.x, this.y, 10);
    particles.spawnSpark(this.x, this.y, 6);
  }

  protected drawSprite(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    ctx.drawImage(spriteCache.cage, x, y, 32, 32);
  }
}

// ------------------------------------------
// 4. RED MONSTER (Aggro Goblin AI)
// ------------------------------------------
export type MonsterState = 'IDLE' | 'CHASE' | 'ATTACK' | 'RETREAT';

export class RedMonster extends Destructible {
  private state: MonsterState = 'IDLE';
  private retreatTimer = 0;
  private speed = 60;

  constructor(x: number, y: number, stage: number) {
    const hp = Math.round(60 * Math.pow(1.2, stage - 1));
    super(x, y, hp, 32, 32, 'redMonster', 5);
  }

  public override update(
    dt: number,
    kingPos: { x: number; y: number },
    onHitKing: (fromX: number, fromY: number) => void
  ): void {
    if (!this.alive) return;

    const dx = kingPos.x - this.x;
    const dy = kingPos.y - this.y;
    const dist = Math.hypot(dx, dy);

    if (this.state === 'IDLE') {
      if (dist < 120) {
        this.state = 'CHASE';
      }
    } else if (this.state === 'CHASE') {
      if (dist < 26) {
        // Attack hit!
        this.state = 'ATTACK';
        soundEngine.playKnockback();
        soundEngine.vibrateLight();
        onHitKing(this.x, this.y);
        this.retreatTimer = 1.0;
        this.state = 'RETREAT';
      } else {
        // Move towards king
        const vx = (dx / dist) * this.speed;
        const vy = (dy / dist) * this.speed;
        this.x += vx * dt;
        this.y += vy * dt;
      }
    } else if (this.state === 'RETREAT') {
      this.retreatTimer -= dt;
      if (dist > 0) {
        // Back off slowly
        const vx = (-dx / dist) * 40;
        const vy = (-dy / dist) * 40;
        this.x += vx * dt;
        this.y += vy * dt;
      }
      if (this.retreatTimer <= 0) {
        this.state = dist < 140 ? 'CHASE' : 'IDLE';
      }
    }
  }

  protected onDeath(particles: ParticleSystem): void {
    soundEngine.playAttack();
    soundEngine.vibrateLight();
    particles.spawnSpark(this.x, this.y, 8);
  }

  protected drawSprite(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    ctx.drawImage(spriteCache.redMonster, x, y, 32, 32);
  }
}

// ------------------------------------------
// 5. ARCHER TOWER (Shoots straight arrows)
// ------------------------------------------
export class ArcherTower extends Destructible {
  private fireTimer = 0;
  private readonly fireInterval = 2.0;
  private readonly attackRange = 150;

  constructor(x: number, y: number, stage: number) {
    const hp = Math.round(120 * Math.pow(1.25, stage - 1));
    super(x, y, hp, 32, 32, 'archerTower', 8);
  }

  public override update(
    dt: number,
    kingPos: { x: number; y: number },
    _onHitKing: (fromX: number, fromY: number) => void,
    arrows: Arrow[]
  ): void {
    if (!this.alive) return;

    this.fireTimer += dt;
    const dist = Math.hypot(kingPos.x - this.x, kingPos.y - this.y);

    if (dist <= this.attackRange && this.fireTimer >= this.fireInterval) {
      this.fireTimer = 0;
      // Fire arrow straight toward king's current position
      arrows.push(new Arrow(this.x, this.y, kingPos.x, kingPos.y));
    }
  }

  protected onDeath(particles: ParticleSystem): void {
    soundEngine.playAttack();
    soundEngine.vibrateMedium();
    particles.spawnWoodDebris(this.x, this.y, 8);
    particles.spawnSpark(this.x, this.y, 8);
  }

  protected drawSprite(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    ctx.drawImage(spriteCache.archerTower, x, y, 32, 32);
  }
}

// ------------------------------------------
// 6. BOSS TOWER (Northernmost Stage Objective)
// ------------------------------------------
export class BossTower extends Destructible {
  constructor(x: number, y: number, stage: number) {
    const hp = Math.round(300 * (1 + (stage - 1) * 0.35));
    // 32x32 sprite scaled to 64x64
    super(x, y, hp, 64, 64, 'bossTower', 50);
  }

  protected onDeath(particles: ParticleSystem): void {
    soundEngine.playVictoryFanfare();
    soundEngine.vibrateHeavy();
    particles.spawnSpark(this.x, this.y, 20);
    particles.spawnWoodDebris(this.x, this.y, 16);
  }

  protected drawSprite(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    ctx.drawImage(spriteCache.bossTower, x, y, 64, 64);
  }
}

// ------------------------------------------
// 7. ARROW PROJECTILE
// ------------------------------------------
export class Arrow {
  public x: number;
  public y: number;
  private vx: number;
  private vy: number;
  private angle: number;
  public alive = true;
  private lifetime = 3.0;

  constructor(fromX: number, fromY: number, targetX: number, targetY: number) {
    this.x = fromX;
    this.y = fromY;
    const dx = targetX - fromX;
    const dy = targetY - fromY;
    this.angle = Math.atan2(dy, dx);
    const speed = 80; // px/s
    this.vx = Math.cos(this.angle) * speed;
    this.vy = Math.sin(this.angle) * speed;
  }

  public update(
    dt: number,
    kingPos: { x: number; y: number },
    onHitKing: (fromX: number, fromY: number) => void,
    particles: ParticleSystem
  ): void {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.lifetime -= dt;

    if (this.lifetime <= 0) {
      this.alive = false;
      return;
    }

    // Check hit on King (radius ~14px)
    const distToKing = Math.hypot(this.x - kingPos.x, this.y - kingPos.y);
    if (distToKing < 16) {
      this.alive = false;
      soundEngine.playKnockback();
      soundEngine.vibrateLight();
      particles.spawnSpark(this.x, this.y, 4);
      onHitKing(this.x - this.vx * 0.1, this.y - this.vy * 0.1);
    }
  }

  public draw(ctx: CanvasRenderingContext2D, cameraY: number): void {
    const renderY = this.y - cameraY;

    ctx.save();
    ctx.translate(this.x, renderY);
    ctx.rotate(this.angle);
    ctx.drawImage(spriteCache.arrow, -8, -4, 16, 8);
    ctx.restore();
  }
}
