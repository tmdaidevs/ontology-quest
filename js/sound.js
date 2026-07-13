// sound.js — tiny dependency-free sound effects built with the Web Audio API.
// Every "sound" here is a synthesized tone (no audio asset files to fetch), so it
// stays true to the project's zero-dependency, static-files-only constraint.
// A single shared AudioContext is created lazily on first use (browsers block
// audio before a user gesture) and the mute preference is persisted so it
// survives reloads.

const MUTE_KEY = 'ontologyQuest.muted.v1';

let ctx = null;
let muted = localStorage.getItem(MUTE_KEY) === '1';

function getCtx() {
  if (!ctx) {
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtor) return null;
    ctx = new AudioCtor();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export function isMuted() {
  return muted;
}

export function setMuted(value) {
  muted = !!value;
  localStorage.setItem(MUTE_KEY, muted ? '1' : '0');
}

export function toggleMuted() {
  setMuted(!muted);
  return muted;
}

/** Plays a single synthesized tone with a short attack/decay envelope. */
function tone({ freq, start = 0, duration = 0.14, type = 'sine', gain = 0.07, glideTo = null }) {
  const audioCtx = getCtx();
  if (!audioCtx || muted) return;
  const t0 = audioCtx.currentTime + start;
  const osc = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (glideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(1, glideTo), t0 + duration);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(g).connect(audioCtx.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.03);
}

// Small, tasteful sound palette — kept quiet (low gain) and short so it reads as
// UI "feedback" rather than a distraction. Every call is a no-op while muted.
export const sfx = {
  correct() {
    tone({ freq: 523.25, duration: 0.11, type: 'triangle', gain: 0.08 });
    tone({ freq: 659.25, duration: 0.16, start: 0.09, type: 'triangle', gain: 0.08 });
  },
  wrong() {
    tone({ freq: 220, duration: 0.18, type: 'sawtooth', gain: 0.05, glideTo: 130 });
  },
  hint() {
    tone({ freq: 880, duration: 0.09, type: 'sine', gain: 0.045 });
  },
  hop() {
    tone({ freq: 460, duration: 0.08, type: 'triangle', gain: 0.055, glideTo: 640 });
  },
  badge() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
      tone({ freq: f, start: i * 0.09, duration: 0.22, type: 'triangle', gain: 0.075 }));
  },
  levelComplete() {
    [392, 523.25, 659.25, 783.99].forEach((f, i) =>
      tone({ freq: f, start: i * 0.1, duration: 0.26, type: 'triangle', gain: 0.08 }));
  }
};
