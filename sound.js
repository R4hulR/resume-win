/**
 * sound.js — Tiny retro sound effects, synthesized with Web Audio.
 * No audio files. Muted until the visitor turns sound on (tray speaker
 * icon or Display Properties).  Usage: SFX.play('open')
 */
const SFX = (function () {
  let ctx = null;
  let enabled = false;

  function audio() {
    if (!ctx) {
      const Ctor = window.AudioContext || window.webkitAudioContext;
      if (!Ctor) return null;
      ctx = new Ctor();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  // One blip: frequency (Hz), start offset (s), duration (s), waveform, volume, optional pitch slide target
  function tone(freq, start, dur, type = 'square', vol = 0.05, slideTo) {
    const a = audio();
    if (!a) return;
    const t = a.currentTime + start;
    const osc = a.createOscillator();
    const gain = a.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain).connect(a.destination);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }
  const arpeggio = (notes, step, dur, vol) =>
    notes.forEach((f, i) => tone(f, i * step, dur, 'triangle', vol));

  const SOUNDS = {
    open    : () => { tone(660, 0, 0.06); tone(990, 0.05, 0.08); },
    close   : () => { tone(880, 0, 0.06); tone(520, 0.05, 0.08); },
    click   : () => tone(1200, 0, 0.025, 'square', 0.03),
    error   : () => tone(220, 0, 0.2, 'sawtooth', 0.05),
    startup : () => arpeggio([523, 659, 784, 1046], 0.12, 0.35, 0.06),
    shutdown: () => arpeggio([1046, 784, 659, 523], 0.14, 0.4, 0.06),
    squash  : () => tone(300, 0, 0.08, 'square', 0.05, 80),
    oops    : () => tone(200, 0, 0.22, 'sawtooth', 0.05, 100),
    flip    : () => tone(1500, 0, 0.03, 'triangle', 0.04),
    match   : () => { tone(784, 0, 0.08, 'triangle'); tone(1175, 0.07, 0.12, 'triangle'); },
    win     : () => arpeggio([523, 659, 784, 1046, 1318], 0.09, 0.2, 0.06),
    crash   : () => tone(400, 0, 0.5, 'sawtooth', 0.07, 40),
    bonus   : () => { tone(988, 0, 0.05); tone(1319, 0.05, 0.1); },
  };

  return {
    get enabled() { return enabled; },
    set enabled(v) { enabled = !!v; },
    play(name) {
      if (!enabled || !SOUNDS[name]) return;
      try { SOUNDS[name](); } catch (e) { /* audio unavailable */ }
    },
  };
})();
