/**
 * Squad.ts
 * Manages the King (invincible, carrying sine-wave coin tower),
 * and the surrounding Squad of rescued Soldiers (orbiting & auto-attacking).
 */

import { spriteCache } from '../core/SpriteCache';
import { soundEngine } from '../core/SoundEngine';
import { Destructible } from './Destructible';
import { ParticleSystem } from './ParticleSystem';

export class SoldierUnit {
  public x: number;
  public y: number;
  public targetAngle: number;
  private attackCooldown = 0;
  private readonly attackInterval = 0.5; // 20 DPS per soldier
  private slashTimer = 0;
  private slashTarget: { x: number; y: number } | null = null;

  constructor(x: number, y: number, targetAngle: number) {
    this.x = x;
    this.y = y;
    this.targetAngle = targetAngle;
  }

  public update(
    dt: number,
    kingX: number,
    kingY: number,
    orbitRadius: number,
    destructibles: Destructible[],
    particles: ParticleSystem,
    onKill: (d: Destructible) => void
  ): void {
    // 1. Orbit movement: lerp towards target position
    const targetX = kingX + Math.cos(this.targetAngle) * orbitRadius;
    const targetY = kingY + Math.sin(this.targetAngle) * orbitRadius;

    const lerpSpeed = 10;
    this.x += (targetX - this.x) * Math.min(1.0, lerpSpeed * dt);
    this.y += (targetY - this.y) * Math.min(1.0, lerpSpeed * dt);

    // 2. Attack logic
    this.attackCooldown -= dt;
    if (this.slashTimer > 0) {
      this.slashTimer -= dt;
    }

    if (this.attackCooldown <= 0) {
      // Find nearest alive destructible
      let nearest: Destructible | null = null;
      let minDist = orbitRadius + 30; // within soldier reach

      for (const d of destructibles) {
        if (!d.alive) continue;
        const dist = Math.hypot(d.x - this.x, d.y - this.y);
        if (dist < minDist) {
          minDist = dist;
          nearest = d;
        }
      }

      if (nearest) {
        this.attackCooldown = this.attackInterval;
        this.slashTimer = 0.15;
        this.slashTarget = { x: nearest.x, y: nearest.y };

        const died = nearest.takeDamage(10, particles);
        soundEngine.playAttack();
        soundEngine.vibrateLight();

        if (died) {
          onKill(nearest);
        }
      }
    }
  }

  public draw(ctx: CanvasRenderingContext2D, cameraY: number): void {
    const renderY = this.y - cameraY;

    // Draw soldier sprite centered
    ctx.drawImage(spriteCache.soldier, this.x - 16, renderY - 16, 32, 32);

    // Draw sword slash swipe arc if attacking
    if (this.slashTimer > 0 && this.slashTarget) {
      const targetRenderY = this.slashTarget.y - cameraY;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(this.x, renderY);
      ctx.lineTo(this.slashTarget.x, targetRenderY);
      ctx.strokeStyle = '#fef08a'; // bright slash line
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.restore();
    }
  }
}

export class Squad {
  public kingX = 200;
  public kingY = 750;
  public velocityX = 0;
  public velocityY = 0;

  public stackedCoins = 0;
  public soldiers: SoldierUnit[] = [];

  private knockbackVx = 0;
  private knockbackVy = 0;
  private slowTimer = 0;
  private totalTime = 0;

  // King's Royal Attack
  private kingAttackCooldown = 0;
  private kingSlashTimer = 0;
  private kingSlashTarget: { x: number; y: number } | null = null;

  private readonly worldWidth = 400;
  private readonly worldHeight = 900;
  private readonly baseSpeed = 120; // px/s

  constructor(spawnX = 200, spawnY = 750, initialSoldiers = 3) {
    this.kingX = spawnX;
    this.kingY = spawnY;
    if (initialSoldiers > 0) {
      this.addSoldiers(initialSoldiers);
    }
  }

  public get auraRadius(): number {
    return 75 + Math.min(85, this.soldiers.length * 2.5);
  }

  public addSoldiers(count: number): void {
    const currentCount = this.soldiers.length;
    const newTotal = currentCount + count;

    for (let i = 0; i < count; i++) {
      // Spawn near king
      const angle = (Math.PI * 2 * (currentCount + i)) / newTotal;
      const initialDist = 30;
      const s = new SoldierUnit(
        this.kingX + Math.cos(angle) * initialDist,
        this.kingY + Math.sin(angle) * initialDist,
        angle
      );
      this.soldiers.push(s);
    }

    // Re-distribute orbit angles evenly
    this.rebalanceAngles();
  }

  private rebalanceAngles(): void {
    const total = this.soldiers.length;
    if (total === 0) return;
    for (let i = 0; i < total; i++) {
      this.soldiers[i].targetAngle = (Math.PI * 2 * i) / total;
    }
  }

  public addCoins(count: number): void {
    this.stackedCoins += count;
  }

  public applyKnockback(fromX: number, fromY: number): void {
    const dx = this.kingX - fromX;
    const dy = this.kingY - fromY;
    const dist = Math.hypot(dx, dy) || 1;

    // Push away with impulse
    const impulse = 180;
    this.knockbackVx = (dx / dist) * impulse;
    this.knockbackVy = (dy / dist) * impulse;
    this.slowTimer = 0.2; // 0.2s slow
  }

  public update(
    dt: number,
    inputDir: { dx: number; dy: number },
    destructibles: Destructible[],
    particles: ParticleSystem,
    onKill: (d: Destructible) => void
  ): void {
    this.totalTime += dt;

    // 1. Move King
    let currentSpeed = this.baseSpeed;
    if (this.slowTimer > 0) {
      this.slowTimer -= dt;
      currentSpeed *= 0.45; // Slowed down during knockback
    }

    // Apply input velocity
    this.velocityX = inputDir.dx * currentSpeed;
    this.velocityY = inputDir.dy * currentSpeed;

    // Apply knockback decay
    if (Math.hypot(this.knockbackVx, this.knockbackVy) > 5) {
      this.velocityX += this.knockbackVx;
      this.velocityY += this.knockbackVy;
      this.knockbackVx *= Math.max(0, 1 - dt * 8);
      this.knockbackVy *= Math.max(0, 1 - dt * 8);
    } else {
      this.knockbackVx = 0;
      this.knockbackVy = 0;
    }

    this.kingX += this.velocityX * dt;
    this.kingY += this.velocityY * dt;

    // Clamp within map boundaries
    const margin = 20;
    this.kingX = Math.max(margin, Math.min(this.worldWidth - margin, this.kingX));
    this.kingY = Math.max(margin, Math.min(this.worldHeight - margin, this.kingY));

    // Rotate soldier orbit slowly around king
    const orbitSpeed = 0.6; // rad/s
    for (const soldier of this.soldiers) {
      soldier.targetAngle += orbitSpeed * dt;
    }

    // 2. King's Royal Melee Attack (Swings sword within 45px)
    this.kingAttackCooldown -= dt;
    if (this.kingSlashTimer > 0) {
      this.kingSlashTimer -= dt;
    }

    if (this.kingAttackCooldown <= 0) {
      let nearest: Destructible | null = null;
      let minDist = 48;

      for (const d of destructibles) {
        if (!d.alive) continue;
        const dist = Math.hypot(d.x - this.kingX, d.y - this.kingY);
        if (dist < minDist) {
          minDist = dist;
          nearest = d;
        }
      }

      if (nearest) {
        this.kingAttackCooldown = 0.35;
        this.kingSlashTimer = 0.15;
        this.kingSlashTarget = { x: nearest.x, y: nearest.y };

        const died = nearest.takeDamage(15, particles);
        soundEngine.playAttack();
        soundEngine.vibrateLight();

        if (died) {
          onKill(nearest);
        }
      }
    }

    // 3. Update Soldiers
    const orbitRadius = Math.max(35, this.auraRadius * 0.7);
    for (const soldier of this.soldiers) {
      soldier.update(dt, this.kingX, this.kingY, orbitRadius, destructibles, particles, onKill);
    }
  }

  public draw(ctx: CanvasRenderingContext2D, cameraY: number): void {
    const renderKingY = this.kingY - cameraY;

    // 1. Draw Aura Circle
    ctx.save();
    ctx.beginPath();
    ctx.arc(this.kingX, renderKingY, this.auraRadius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(74, 222, 128, 0.12)'; // Faint green fill
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(74, 222, 128, 0.45)'; // Bright green border
    ctx.setLineDash([6, 4]);
    ctx.stroke();
    ctx.restore();

    // 2. Draw Soldiers
    for (const soldier of this.soldiers) {
      soldier.draw(ctx, cameraY);
    }

    // 3. Draw King
    ctx.drawImage(spriteCache.king, this.kingX - 16, renderKingY - 16, 32, 32);

    // Draw King's Golden Sword Slash
    if (this.kingSlashTimer > 0 && this.kingSlashTarget) {
      const targetRenderY = this.kingSlashTarget.y - cameraY;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(this.kingX, renderKingY);
      ctx.lineTo(this.kingSlashTarget.x, targetRenderY);
      ctx.strokeStyle = '#fbbf24'; // Vivid Gold slash
      ctx.lineWidth = 4;
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 8;
      ctx.stroke();
      ctx.restore();
    }

    // 4. Draw Coin Tower atop King's head
    this.drawCoinTower(ctx, renderKingY);
  }

  /**
   * Renders the swaying Sine-wave coin tower on top of the King
   */
  private drawCoinTower(ctx: CanvasRenderingContext2D, renderKingY: number): void {
    if (this.stackedCoins <= 0) return;

    // Scale stacked coins so it doesn't exceed 60 visual layers
    const layerScale = Math.max(1, Math.ceil(this.stackedCoins / 60));
    const totalLayers = Math.min(60, Math.ceil(this.stackedCoins / layerScale));

    const coinHeight = 3.5;
    const startY = renderKingY - 18;

    for (let i = 0; i < totalLayers; i++) {
      // Sine wave swaying formula from blueprint:
      // Xi = Xking + sin(time * 0.008 - i * 0.15) * min(18, i * 0.4) - velocityX * i * 0.25
      const swayOffset =
        Math.sin(this.totalTime * 8 - i * 0.15) * Math.min(18, i * 0.4) -
        (this.velocityX / this.baseSpeed) * Math.min(22, i * 0.35);

      const coinX = this.kingX + swayOffset;
      const coinY = startY - i * coinHeight;

      // Draw mini coin slice
      ctx.drawImage(spriteCache.coin, coinX - 7, coinY - 3, 14, 6);
    }

    // Gold Number Badge at the top of the tower
    const topSway =
      Math.sin(this.totalTime * 8 - totalLayers * 0.15) * Math.min(18, totalLayers * 0.4) -
      (this.velocityX / this.baseSpeed) * Math.min(22, totalLayers * 0.35);
    const topY = startY - totalLayers * coinHeight - 8;
    const topX = this.kingX + topSway;

    ctx.save();
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fef08a';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2.5;
    ctx.strokeText(`+${this.stackedCoins}`, topX, topY);
    ctx.fillText(`+${this.stackedCoins}`, topX, topY);
    ctx.restore();
  }
}
