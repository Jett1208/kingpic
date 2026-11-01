/**
 * SoundEngine.ts
 * Synthesizes 8-bit sound effects and chiptune background music using the Web Audio API.
 * Integrates Web Vibration API (Haptics) with fallbacks.
 */

export class SoundEngine {
  private static instance: SoundEngine;
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private bgmGain: GainNode | null = null;

  private isMuted = false;
  private isHapticEnabled = true;
  private bgmIntervalId: number | null = null;
  private bgmStep = 0;

  private constructor() {
    // Lazy initialization on first user interaction
  }

  public static getInstance(): SoundEngine {
    if (!SoundEngine.instance) {
      SoundEngine.instance = new SoundEngine();
    }
    return SoundEngine.instance;
  }

  private initAudio(): void {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.35, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.bgmGain = this.ctx.createGain();
      this.bgmGain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      this.bgmGain.connect(this.masterGain);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : 0.35, this.ctx.currentTime);
    }
  }

  public setHapticEnabled(enabled: boolean): void {
    this.isHapticEnabled = enabled;
  }

  // ==========================================
  // HAPTIC FEEDBACK (Vibration API)
  // ==========================================

  public vibrateLight(): void {
    if (this.isHapticEnabled && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(20);
      } catch {
        // Ignore devices with restricted vibration
      }
    }
  }

  public vibrateMedium(): void {
    if (this.isHapticEnabled && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(60);
      } catch {
        // Ignore
      }
    }
  }

  public vibrateHeavy(): void {
    if (this.isHapticEnabled && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([80, 40, 100]);
      } catch {
        // Ignore
      }
    }
  }

  // ==========================================
  // SOUND EFFECTS (SFX)
  // ==========================================

  /**
   * Soldier sword attack hit: Square wave 200ms with fast pitch drop 800 -> 300 Hz
   */
  public playAttack(): void {
    if (this.isMuted) return;
    this.initAudio();
    if (!this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    const now = this.ctx.currentTime;
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.12);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.12);
  }

  /**
   * Coin collection: Crisp chime sine wave 1200 Hz with fast harmonic
   */
  public playCoin(): void {
    if (this.isMuted) return;
    this.initAudio();
    if (!this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    const now = this.ctx.currentTime;
    osc.frequency.setValueAtTime(1100, now);
    osc.frequency.exponentialRampToValueAtTime(1600, now + 0.08);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.09);
  }

  /**
   * Cage break: Noise burst + deep wood thump
   */
  public playCageBreak(): void {
    if (this.isMuted) return;
    this.initAudio();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;

    // Noise buffer
    const bufferSize = this.ctx.sampleRate * 0.15;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(1000, now);
    noiseFilter.frequency.linearRampToValueAtTime(200, now + 0.15);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.4, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    noise.start(now);

    // Deep wood tone
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.exponentialRampToValueAtTime(70, now + 0.15);

    oscGain.gain.setValueAtTime(0.5, now);
    oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    osc.connect(oscGain);
    oscGain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  /**
   * Soft Knockback / Monster hit on king: Clang triangle wave 500 Hz
   */
  public playKnockback(): void {
    if (this.isMuted) return;
    this.initAudio();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.18);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.18);
  }

  /**
   * Victory Fanfare: Royal 8-bit arpeggio
   */
  public playVictoryFanfare(): void {
    if (this.isMuted) return;
    this.initAudio();
    if (!this.ctx || !this.masterGain) return;

    const notes = [261.63, 329.63, 392.0, 523.25, 659.25, 783.99, 1046.5];
    const now = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, now + idx * 0.12);

      const noteDuration = idx === notes.length - 1 ? 0.6 : 0.15;
      gain.gain.setValueAtTime(0.3, now + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + noteDuration);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(now + idx * 0.12);
      osc.stop(now + idx * 0.12 + noteDuration);
    });
  }

  /**
   * Star earned ding: Ascending pitch
   */
  public playStarDing(starIndex: number): void {
    if (this.isMuted) return;
    this.initAudio();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    const baseFreq = 600 + starIndex * 250;
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.16);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.2);
  }

  // ==========================================
  // BACKGROUND MUSIC (BGM CHIPTUNE LOOP)
  // ==========================================

  public startBGM(): void {
    if (this.bgmIntervalId !== null) return;
    this.initAudio();

    // 140 BPM cheerful march melody (frequencies in Hz)
    // C4, E4, G4, C5, A4, G4, E4, D4 pattern
    const melody = [
      261.63, 0, 329.63, 0, 392.00, 392.00, 523.25, 0,
      440.00, 0, 392.00, 0, 329.63, 329.63, 293.66, 0,
      261.63, 329.63, 392.00, 523.25, 440.00, 392.00, 349.23, 329.63,
      293.66, 0, 329.63, 0, 261.63, 0, 0, 0
    ];

    const bass = [
      130.81, 130.81, 164.81, 164.81, 196.00, 196.00, 130.81, 130.81,
      174.61, 174.61, 196.00, 196.00, 164.81, 164.81, 146.83, 146.83,
      130.81, 130.81, 164.81, 164.81, 174.61, 174.61, 164.81, 164.81,
      146.83, 146.83, 196.00, 196.00, 130.81, 130.81, 130.81, 130.81
    ];

    const stepDurationMs = 120; // 16th note timing

    this.bgmStep = 0;
    this.bgmIntervalId = window.setInterval(() => {
      if (this.isMuted || !this.ctx || !this.bgmGain) return;
      if (this.ctx.state !== 'running') return;

      const now = this.ctx.currentTime;
      const noteFreq = melody[this.bgmStep % melody.length];
      const bassFreq = bass[this.bgmStep % bass.length];

      // Play melody
      if (noteFreq > 0) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(noteFreq, now);

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

        osc.connect(gain);
        gain.connect(this.bgmGain);

        osc.start(now);
        osc.stop(now + 0.1);
      }

      // Play bass
      if (bassFreq > 0) {
        const oscB = this.ctx.createOscillator();
        const gainB = this.ctx.createGain();
        oscB.type = 'triangle';
        oscB.frequency.setValueAtTime(bassFreq, now);

        gainB.gain.setValueAtTime(0.12, now);
        gainB.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

        oscB.connect(gainB);
        gainB.connect(this.bgmGain);

        oscB.start(now);
        oscB.stop(now + 0.1);
      }

      this.bgmStep++;
    }, stepDurationMs);
  }

  public stopBGM(): void {
    if (this.bgmIntervalId !== null) {
      clearInterval(this.bgmIntervalId);
      this.bgmIntervalId = null;
    }
  }
}

export const soundEngine = SoundEngine.getInstance();
