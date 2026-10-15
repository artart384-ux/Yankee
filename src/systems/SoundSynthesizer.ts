/**
 * SoundSynthesizer - Web Audio API Retro 16/32-bit Sound FX & Street Synth BGM
 * Fully self-contained, no external audio assets needed!
 */
export class SoundSynthesizer {
  private static instance: SoundSynthesizer;
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private bgmOscillators: OscillatorNode[] = [];
  private bgmGain: GainNode | null = null;
  private bgmPlaying: boolean = false;
  private bgmInterval: number | null = null;

  private constructor() {
    // AudioContext will be initialized on first user interaction
  }

  public static getInstance(): SoundSynthesizer {
    if (!SoundSynthesizer.instance) {
      SoundSynthesizer.instance = new SoundSynthesizer();
    }
    return SoundSynthesizer.instance;
  }

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.bgmGain) {
      this.bgmGain.gain.value = this.isMuted ? 0 : 0.08;
    }
    return this.isMuted;
  }

  // --- SOUND EFFECTS ---

  /** Melee punch / Strike impact */
  public playPunch() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.13);
  }

  /** Sharp blade slash / Slash damage */
  public playSlash() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const bufferSize = this.ctx.sampleRate * 0.15;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1800, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.15);
    filter.Q.value = 3.5;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start();
  }

  /** Piercing thrust needle / Pierce damage */
  public playPierce() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1600, this.ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.09);
  }

  /** Heavy impact shockwave / Knockdown */
  public playHeavyHit() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(25, this.ctx.currentTime + 0.25);

    gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.26);
  }

  /** Phantom Dash / Slide */
  public playDash() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(450, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + 0.2);

    gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.21);
  }

  /** Spirit Aura Burst / Awakening */
  public playAuraBurst() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const freqs = [330, 440, 550, 660, 880];
    freqs.forEach((f, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, this.ctx!.currentTime + i * 0.04);
      osc.frequency.exponentialRampToValueAtTime(f * 1.5, this.ctx!.currentTime + i * 0.04 + 0.3);

      gain.gain.setValueAtTime(0, this.ctx!.currentTime);
      gain.gain.setValueAtTime(0.12, this.ctx!.currentTime + i * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.005, this.ctx!.currentTime + i * 0.04 + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(this.ctx!.currentTime + i * 0.04);
      osc.stop(this.ctx!.currentTime + i * 0.04 + 0.45);
    });
  }

  /** Level Up fanfare */
  public playLevelUp() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const notes = [261.63, 329.63, 392.0, 523.25, 659.25, 783.99]; // C Major
    notes.forEach((f, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, this.ctx!.currentTime + i * 0.08);

      gain.gain.setValueAtTime(0.2, this.ctx!.currentTime + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx!.currentTime + i * 0.08 + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(this.ctx!.currentTime + i * 0.08);
      osc.stop(this.ctx!.currentTime + i * 0.08 + 0.35);
    });
  }

  /** Button click / UI beeps */
  public playUI() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(700, this.ctx.currentTime);
    osc.frequency.setValueAtTime(950, this.ctx.currentTime + 0.03);

    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.06);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.07);
  }

  // --- PROCEDURAL STREET-PUNK SYNTH BACKGROUND MUSIC ---
  public startStreetSynthBGM() {
    if (this.bgmPlaying) return;
    this.initCtx();
    if (!this.ctx) return;

    this.bgmPlaying = true;
    this.bgmGain = this.ctx.createGain();
    this.bgmGain.gain.setValueAtTime(this.isMuted ? 0 : 0.07, this.ctx.currentTime);
    this.bgmGain.connect(this.ctx.destination);

    // Neon Cyberpunk bassline progression (D minor / F / C / G)
    const bassline = [146.83, 146.83, 174.61, 130.81, 196.0, 146.83, 174.61, 220.0];
    let step = 0;

    const tempo = 124; // BPM
    const intervalMs = (60 / tempo) * 500; // eighth notes

    this.bgmInterval = window.setInterval(() => {
      if (!this.ctx || !this.bgmPlaying || this.isMuted) return;

      const f = bassline[step % bassline.length];
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, this.ctx.currentTime);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450 + Math.sin(step) * 200, this.ctx.currentTime);

      g.gain.setValueAtTime(0.18, this.ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.22);

      osc.connect(filter);
      filter.connect(g);
      g.connect(this.bgmGain!);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.23);

      // Hi-hat noise on off-beats
      if (step % 2 === 1) {
        this.playHiHat();
      }

      step++;
    }, intervalMs);
  }

  private playHiHat() {
    if (!this.ctx || this.isMuted || !this.bgmGain) return;
    const bufferSize = this.ctx.sampleRate * 0.04;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 7000;

    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.04, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.035);

    noise.connect(filter);
    filter.connect(g);
    g.connect(this.bgmGain);

    noise.start();
  }

  public stopBGM() {
    this.bgmPlaying = false;
    if (this.bgmInterval !== null) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
  }
}

