/**
 * Web Audio API & Haptic Engine
 * 100% Offline Synthesizer - No external MP3/audio files needed
 */

class SoundEngine {
  constructor() {
    this.audioCtx = null;
    this.alarmOscillators = [];
    this.isAlarmRunning = false;
  }

  getAudioContext() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  // Taptic / Haptic Vibration
  vibrate(pattern = [30]) {
    try {
      if ('vibrate' in navigator) {
        navigator.vibrate(pattern);
      }
    } catch (e) {
      // Ignored if unavailable
    }
  }

  // Click Feedback
  playClick() {
    this.vibrate([15]);
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    } catch (e) {}
  }

  // Success Chime (3 ascending tones)
  playSuccess() {
    this.vibrate([30, 40, 30]);
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
      notes.forEach((freq, idx) => {
        const startTime = ctx.currentTime + idx * 0.1;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.18, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.35);
      });
    } catch (e) {}
  }

  // Budget Warning Alert
  playWarning() {
    this.vibrate([60, 50, 60, 50, 80]);
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const freqs = [880, 740, 880];
      freqs.forEach((freq, i) => {
        const start = ctx.currentTime + i * 0.12;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.15, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.1);
      });
    } catch (e) {}
  }

  // Loud Scheduler Alarm (Continuous Siren until stopped)
  startLoudAlarm(onStopCallback) {
    if (this.isAlarmRunning) return;
    this.isAlarmRunning = true;
    this.vibrate([200, 100, 200, 100, 400, 100, 400]);

    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'square';

      // Pitch sweep
      const now = ctx.currentTime;
      osc1.frequency.setValueAtTime(600, now);
      osc2.frequency.setValueAtTime(800, now);

      let step = 0;
      const interval = setInterval(() => {
        if (!this.isAlarmRunning) {
          clearInterval(interval);
          return;
        }
        this.vibrate([150, 80, 150]);
        const t = ctx.currentTime;
        step++;
        const f1 = (step % 2 === 0) ? 900 : 650;
        const f2 = (step % 2 === 0) ? 1200 : 850;
        osc1.frequency.setValueAtTime(f1, t);
        osc2.frequency.setValueAtTime(f2, t);
      }, 350);

      gain.gain.setValueAtTime(0.28, now);
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();

      this.alarmOscillators = [osc1, osc2, gain];
      this.alarmInterval = interval;
    } catch (e) {
      console.error('Audio alarm start error:', e);
    }
  }

  stopAlarm() {
    this.isAlarmRunning = false;
    if (this.alarmInterval) {
      clearInterval(this.alarmInterval);
      this.alarmInterval = null;
    }
    try {
      this.alarmOscillators.forEach(node => {
        try {
          if (node.stop) node.stop();
          if (node.disconnect) node.disconnect();
        } catch (err) {}
      });
    } catch (e) {}
    this.alarmOscillators = [];
  }
}

window.soundEngine = new SoundEngine();
