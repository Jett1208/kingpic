/**
 * InputManager.ts
 * Manages Touch Floating Joystick (with 10px deadzone, 60px outer, 28px knob)
 * and Desktop WASD/Arrow keys for universal control.
 */

export interface JoystickState {
  active: boolean;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  dx: number;
  dy: number;
}

export class InputManager {
  private element: HTMLElement | null = null;
  private joystick: JoystickState = {
    active: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    dx: 0,
    dy: 0,
  };

  private keys: Record<string, boolean> = {};
  private activeTouchId: number | null = null;
  public onFirstMove?: () => void;
  private hasReportedFirstMove = false;

  private boundTouchStart = this.handleTouchStart.bind(this);
  private boundTouchMove = this.handleTouchMove.bind(this);
  private boundTouchEnd = this.handleTouchEnd.bind(this);
  private boundKeyDown = this.handleKeyDown.bind(this);
  private boundKeyUp = this.handleKeyUp.bind(this);

  public attach(element: HTMLElement): void {
    this.element = element;
    element.addEventListener('touchstart', this.boundTouchStart, { passive: false });
    element.addEventListener('touchmove', this.boundTouchMove, { passive: false });
    element.addEventListener('touchend', this.boundTouchEnd, { passive: false });
    element.addEventListener('touchcancel', this.boundTouchEnd, { passive: false });

    window.addEventListener('keydown', this.boundKeyDown);
    window.addEventListener('keyup', this.boundKeyUp);
  }

  public detach(): void {
    if (this.element) {
      this.element.removeEventListener('touchstart', this.boundTouchStart);
      this.element.removeEventListener('touchmove', this.boundTouchMove);
      this.element.removeEventListener('touchend', this.boundTouchEnd);
      this.element.removeEventListener('touchcancel', this.boundTouchEnd);
    }
    window.removeEventListener('keydown', this.boundKeyDown);
    window.removeEventListener('keyup', this.boundKeyUp);
    this.element = null;
    this.reset();
  }

  public reset(): void {
    this.joystick.active = false;
    this.joystick.dx = 0;
    this.joystick.dy = 0;
    this.activeTouchId = null;
    this.keys = {};
  }

  private handleTouchStart(e: TouchEvent): void {
    if (this.activeTouchId !== null) return;
    const touch = e.changedTouches[0];
    const rect = this.element?.getBoundingClientRect();
    if (!rect) return;

    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    // Activate only in bottom 65% of the screen (generous for elderly users)
    if (y < rect.height * 0.35) return;

    e.preventDefault();
    this.activeTouchId = touch.identifier;
    this.joystick.active = true;
    this.joystick.startX = x;
    this.joystick.startY = y;
    this.joystick.currentX = x;
    this.joystick.currentY = y;
    this.joystick.dx = 0;
    this.joystick.dy = 0;
  }

  private handleTouchMove(e: TouchEvent): void {
    if (this.activeTouchId === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === this.activeTouchId) {
        e.preventDefault();
        const rect = this.element?.getBoundingClientRect();
        if (!rect) return;

        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;

        this.joystick.currentX = x;
        this.joystick.currentY = y;

        const rawDx = x - this.joystick.startX;
        const rawDy = y - this.joystick.startY;
        const dist = Math.hypot(rawDx, rawDy);

        const deadzone = 10;
        const maxDist = 60;

        if (dist > deadzone) {
          const clampedDist = Math.min(dist, maxDist);
          const angle = Math.atan2(rawDy, rawDx);
          const power = (clampedDist - deadzone) / (maxDist - deadzone);

          this.joystick.dx = Math.cos(angle) * power;
          this.joystick.dy = Math.sin(angle) * power;

          if (!this.hasReportedFirstMove) {
            this.hasReportedFirstMove = true;
            this.onFirstMove?.();
          }
        } else {
          this.joystick.dx = 0;
          this.joystick.dy = 0;
        }
        break;
      }
    }
  }

  private handleTouchEnd(e: TouchEvent): void {
    if (this.activeTouchId === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === this.activeTouchId) {
        e.preventDefault();
        this.activeTouchId = null;
        this.joystick.active = false;
        this.joystick.dx = 0;
        this.joystick.dy = 0;
        break;
      }
    }
  }

  private handleKeyDown(e: KeyboardEvent): void {
    this.keys[e.key.toLowerCase()] = true;
    if (!this.hasReportedFirstMove && (this.keys['w'] || this.keys['a'] || this.keys['s'] || this.keys['d'] || e.key.startsWith('Arrow'))) {
      this.hasReportedFirstMove = true;
      this.onFirstMove?.();
    }
  }

  private handleKeyUp(e: KeyboardEvent): void {
    this.keys[e.key.toLowerCase()] = false;
  }

  public getDirection(): { dx: number; dy: number } {
    let dx = 0;
    let dy = 0;

    // Keyboard fallback
    if (this.keys['arrowup'] || this.keys['w']) dy -= 1;
    if (this.keys['arrowdown'] || this.keys['s']) dy += 1;
    if (this.keys['arrowleft'] || this.keys['a']) dx -= 1;
    if (this.keys['arrowright'] || this.keys['d']) dx += 1;

    if (dx !== 0 || dy !== 0) {
      const len = Math.hypot(dx, dy);
      return { dx: dx / len, dy: dy / len };
    }

    // Touch joystick
    return { dx: this.joystick.dx, dy: this.joystick.dy };
  }

  /**
   * Render translucent joystick on screen canvas if active
   */
  public render(ctx: CanvasRenderingContext2D): void {
    if (!this.joystick.active) return;

    ctx.save();

    // Outer circle
    ctx.beginPath();
    ctx.arc(this.joystick.startX, this.joystick.startY, 60, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.stroke();

    // Inner knob position clamped to outer radius
    const rawDx = this.joystick.currentX - this.joystick.startX;
    const rawDy = this.joystick.currentY - this.joystick.startY;
    const dist = Math.hypot(rawDx, rawDy);
    const maxRadius = 60;
    let knobX = this.joystick.currentX;
    let knobY = this.joystick.currentY;

    if (dist > maxRadius) {
      const angle = Math.atan2(rawDy, rawDx);
      knobX = this.joystick.startX + Math.cos(angle) * maxRadius;
      knobY = this.joystick.startY + Math.sin(angle) * maxRadius;
    }

    // Inner knob
    ctx.beginPath();
    ctx.arc(knobX, knobY, 28, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(250, 204, 21, 0.6)'; // Gold knob
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.stroke();

    ctx.restore();
  }
}
