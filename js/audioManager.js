// audioManager.js — looping background music (with crossfade), one-off sfx,
// and the persistent mute/volume control.

const bgm = document.getElementById('bgm-audio');
const sfx = document.getElementById('sfx-audio');
const muteBtn = document.getElementById('mute-btn');
const volumeSlider = document.getElementById('volume-slider');

const AUDIO_BASE = 'assets/audio/';
const FADE_MS = 800;
const VOLUME_STORAGE_KEY = 'geworld-volume';
const MUTED_STORAGE_KEY = 'geworld-muted';

// This is a real multi-page site (separate .html files), so the JS runtime
// — and anything playing in it — resets on every navigation. What we *can*
// carry across pages is the player's preference: read it back from
// localStorage on load, and the slider/mute button start where they left off.
const storedVolume = parseFloat(localStorage.getItem(VOLUME_STORAGE_KEY));
if (!Number.isNaN(storedVolume)) {
  volumeSlider.value = String(storedVolume);
}

let targetVolume = parseFloat(volumeSlider.value);
let muted = localStorage.getItem(MUTED_STORAGE_KEY) === 'true';
let fadeHandle = null;
let currentTrack = null; // filename currently loaded into bgm, so we can skip no-op switches

function effectiveVolume() {
  return muted ? 0 : targetVolume;
}

function applyVolumeImmediate() {
  bgm.volume = effectiveVolume();
  sfx.volume = effectiveVolume();
}

function fadeTo(vol, durationMs, onDone) {
  cancelAnimationFrame(fadeHandle);
  const start = bgm.volume;
  const startTime = performance.now();

  function step(now) {
    const t = Math.min(1, (now - startTime) / durationMs);
    bgm.volume = start + (vol - start) * t;
    if (t < 1) {
      fadeHandle = requestAnimationFrame(step);
    } else if (onDone) {
      onDone();
    }
  }
  fadeHandle = requestAnimationFrame(step);
}

/**
 * Call once from a real click handler (the title screen's Start button) so
 * the browser's autoplay policy allows audio playback for the rest of the
 * session. Safe to call more than once.
 */
export function unlock() {
  applyVolumeImmediate();
  bgm.play().then(() => bgm.pause()).catch(() => {
    // Autoplay blocked or file missing — fine, later playMusic() calls
    // will retry from a scene transition, still inside the unlocked session.
  });
}

/**
 * Switch (crossfade) the looping background track. Pass null/undefined to
 * leave whatever is currently playing untouched, per the content schema.
 */
export function playMusic(filename) {
  if (!filename || filename === currentTrack) return;
  currentTrack = filename;

  const swapAndFadeIn = () => {
    bgm.src = AUDIO_BASE + filename;
    bgm.volume = 0;
    bgm.play().catch(() => {});
    fadeTo(effectiveVolume(), FADE_MS);
  };

  if (bgm.src) {
    fadeTo(0, FADE_MS, swapAndFadeIn);
  } else {
    swapAndFadeIn();
  }
}

/** Play a one-off sound effect without touching the looping bgm track. */
export function playSfx(filename) {
  if (!filename) return;
  sfx.src = AUDIO_BASE + filename;
  sfx.volume = effectiveVolume();
  sfx.play().catch(() => {});
}

function updateMuteButton() {
  muteBtn.textContent = muted ? 'Unmute' : 'Mute';
  muteBtn.setAttribute('aria-label', muted ? 'Unmute' : 'Mute');
}

muteBtn.addEventListener('click', () => {
  muted = !muted;
  localStorage.setItem(MUTED_STORAGE_KEY, String(muted));
  applyVolumeImmediate();
  updateMuteButton();
});

volumeSlider.addEventListener('input', () => {
  targetVolume = parseFloat(volumeSlider.value);
  localStorage.setItem(VOLUME_STORAGE_KEY, String(targetVolume));
  if (!muted) applyVolumeImmediate();
});

applyVolumeImmediate();
updateMuteButton();
