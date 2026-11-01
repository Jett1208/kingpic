/**
 * Squad.ts
 * Manages the King (invincible leader with Royal Slash) and the surrounding
 * Squad of Soldiers with HP 20, charging enemies within the Detection Aura,
 * and following in a dynamic Loose Escort Mob formation.
 */

import { spriteCache } from '../core/SpriteCache';
import { soundEngine } from '../core/SoundEngine';
import { Destructible } from './Destructible';
import { ParticleSystem } from './ParticleSystem';

export class SoldierUnit {
  public x: number;
  public y: number;
  public hp = 50;
  public maxHp = 50;
  public alive = true;
  public targetEnemy: Destructible | null = null;
  public formationOffset: { x: number; y: number };

  private attackCooldown = 0;
  private readonly attackInterval = 0.5; // 20 DPS per soldier
  private slashTimer = 0;
  private slashTarget: { x: number; y: number } | null = null;

  constructor(x: number, y: number, offsetX: number, offsetY: number) {
    this.x = x;
    this.y = y;
    this.formationOffset = { x: offsetX, y: offsetY };
  }

  public takeDamage(amount: number, particles: ParticleSystem): boolean {
    if (!this.alive) return false;
    this.hp -= amount;
    particles.spawnDamageNumber(this.x, this.y, amount);
    particles.spawnSpark(this.x, this.y, 4);

    if (this.hp <= 0) {
      this.hp = 0;
      this.alive = false;
      particles.spawnWoodDebris(this.x, this.y, 5);
      soundEngine.playKnockback();
      return true;
    }
    return false;
  }

  public healFull(particles?: ParticleSystem): void {
    if (!this.alive) return;
    this.hp = this.maxHp;
    if (particles) {
      particles.spawnSpark(this.x, this.y, 5);
    }
  }

  public update(
    dt: number,
    kingX: number,
    kingY: number,
    detectionRadius: number,
    destructibles: Destructible[],
    particles: ParticleSystem,
    onKill: (d: Destructible) => void
  ): void {
    if (!this.alive) return;

    this.attackCooldown -= dt;
    if (this.slashTimer > 0) {
      this.slashTimer -= dt;
    }

    // 1. Verify or find targetEnemy within detection radius
    if (
      this.targetEnemy &&
      (!this.targetEnemy.alive ||
        Math.hypot(this.targetEnemy.x - kingX, this.targetEnemy.y - kingY) > detectionRadius * 1.35)
    ) {
      // Enemy dead or outside leash distance: disengage
      this.targetEnemy = null;
    }

    if (!this.targetEnemy) {
      let nearest: Destructible | null = null;
      let minDist = detectionRadius;
      for (const d of destructibles) {
        if (!d.alive) continue;
        const distFromKing = Math.hypot(d.x - kingX, d.y - kingY);
        if (distFromKing <= detectionRadius) {
          const distFromSoldier = Math.hypot(d.x - this.x, d.y - this.y);
          if (distFromSoldier < minDist) {
            minDist = distFromSoldier;
            nearest = d;
          }
        }
      }
      this.targetEnemy = nearest;
    }

    // 2. Movement & Combat Action
    if (this.targetEnemy && this.targetEnemy.alive) {
      // Charge toward target enemy!
      const dx = this.targetEnemy.x - this.x;
      const dy = this.targetEnemy.y - this.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 24) {
        // Sprint to target at 145 px/s
        const speed = 145;
        this.x += (dx / dist) * speed * dt;
        this.y += (dy / dist) * speed * dt;
      } else {
        // In melee combat range!
        if (this.attackCooldown <= 0) {
          this.attackCooldown = this.attackInterval;
          this.slashTimer = 0.15;
          this.slashTarget = { x: this.targetEnemy.x, y: this.targetEnemy.y };

          const died = this.targetEnemy.takeDamage(10, particles);
          soundEngine.playAttack();
          soundEngine.vibrateLight();

          if (died) {
            onKill(this.targetEnemy);
            this.targetEnemy = null;
          }
        }
      }
    } else {
      // 3. Loose Escort Mob: follow King naturally
      const desiredX = kingX + this.formationOffset.x;
      const desiredY = kingY + this.formationOffset.y;
      const dx = desiredX - this.x;
      const dy = desiredY - this.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 6) {
        const followSpeed = dist > 70 ? 165 : 120;
        this.x += (dx / dist) * followSpeed * dt;
        this.y += (dy / dist) * followSpeed * dt;
      }
    }
  }

  public draw(ctx: CanvasRenderingContext2D, cameraY: number): void {
    if (!this.alive) return;
    const renderY = this.y - cameraY;

    // Draw soldier sprite centered
    ctx.drawImage(spriteCache.soldier, this.x - 16, renderY - 16, 32, 32);

    // Mini HP bar if damaged
    if (this.hp < this.maxHp) {
      const barW = 18;
      const barH = 3;
      const barX = this.x - barW / 2;
      const barY = renderY - 18;

      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);

      const percent = Math.max(0, this.hp / this.maxHp);
      ctx.fillStyle = percent > 0.4 ? '#22c55e' : '#ef4444';
      ctx.fillRect(barX, barY, barW * percent, barH);
    }

    // Sword slash swipe arc
    if (this.slashTimer > 0 && this.slashTarget) {
      const targetRenderY = this.slashTarget.y - cameraY;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(this.x, renderY);
      ctx.lineTo(this.slashTarget.x, targetRenderY);
      ctx.strokeStyle = '#fef08a';
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
    return 80 + Math.min(90, this.soldiers.length * 3.5);
  }

  public addSoldiers(count: number): void {
    for (let i = 0; i < count; i++) {
      // Loose cluster offset around King
      const angle = Math.random() * Math.PI * 2;
      const dist = 22 + Math.random() * 34;
      const offsetX = Math.cos(angle) * dist;
      const offsetY = Math.sin(angle) * dist + 12; // slightly trailing King
      const s = new SoldierUnit(this.kingX + offsetX, this.kingY + offsetY, offsetX, offsetY);
      this.soldiers.push(s);
    }
  }

  public addCoins(count: number): void {
    this.stackedCoins += count;
  }

  public healAllSoldiers(particles: ParticleSystem): void {
    for (const soldier of this.soldiers) {
      soldier.healFull(particles);
    }
    soundEngine.playCoin();
  }

  public applyKnockback(fromX: number, fromY: number): void {
    const dx = this.kingX - fromX;
    const dy = this.kingY - fromY;
    const dist = Math.hypot(dx, dy) || 1;

    const impulse = 180;
    this.knockbackVx = (dx / dist) * impulse;
    this.knockbackVy = (dy / dist) * impulse;
    this.slowTimer = 0.2;
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
      currentSpeed *= 0.45;
    }

    this.velocityX = inputDir.dx * currentSpeed;
    this.velocityY = inputDir.dy * currentSpeed;

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

    const margin = 20;
    this.kingX = Math.max(margin, Math.min(this.worldWidth - margin, this.kingX));
    this.kingY = Math.max(margin, Math.min(this.worldHeight - margin, this.kingY));

    // 2. King's Royal Melee Attack
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

    // 3. Update Soldiers & Filter out fallen soldiers
    for (const soldier of this.soldiers) {
      soldier.update(
        dt,
        this.kingX,
        this.kingY,
        this.auraRadius,
        destructibles,
        particles,
        onKill
      );
    }
    this.soldiers = this.soldiers.filter((s) => s.alive);
  }

  public draw(ctx: CanvasRenderingContext2D, cameraY: number): void {
    const renderKingY = this.kingY - cameraY;

    // 1. Draw Detection Aura Circle (Dashed green radar perimeter)
    ctx.save();
    ctx.beginPath();
    ctx.arc(this.kingX, renderKingY, this.auraRadius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(74, 222, 128, 0.08)';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(74, 222, 128, 0.45)';
    ctx.setLineDash([6, 5]);
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
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 4;
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 8;
      ctx.stroke();
      ctx.restore();
    }

    // 4. Draw Coin Tower atop King's head
    this.drawCoinTower(ctx, renderKingY);
  }

  private drawCoinTower(ctx: CanvasRenderingContext2D, renderKingY: number): void {
    if (this.stackedCoins <= 0) return;

    const layerScale = Math.max(1, Math.ceil(this.stackedCoins / 60));
    const totalLayers = Math.min(60, Math.ceil(this.stackedCoins / layerScale));

    const coinHeight = 3.5;
    const startY = renderKingY - 18;

    for (let i = 0; i < totalLayers; i++) {
      const swayOffset =
        Math.sin(this.totalTime * 8 - i * 0.15) * Math.min(18, i * 0.4) -
        (this.velocityX / this.baseSpeed) * Math.min(22, i * 0.35);

      const coinX = this.kingX + swayOffset;
      const coinY = startY - i * coinHeight;

      ctx.drawImage(spriteCache.coin, coinX - 7, coinY - 3, 14, 6);
    }

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
