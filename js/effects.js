// effects.js — film grain generation + the glitch trigger helper.
//
// Grain is drawn once into an offscreen canvas and reused as a repeating
// CSS background image; the flicker itself is a pure CSS animation (see
// effects.css) so there's no per-frame JS redraw loop.

const GRAIN_TILE_SIZE = 128;

function buildGrainDataURL() {
  const canvas = document.createElement('canvas');
  canvas.width = GRAIN_TILE_SIZE;
  canvas.height = GRAIN_TILE_SIZE;
  const ctx = canvas.getContext('2d');
  const imageData = ctx.createImageData(GRAIN_TILE_SIZE, GRAIN_TILE_SIZE);

  for (let i = 0; i < imageData.data.length; i += 4) {
    const shade = Math.floor(Math.random() * 255);
    imageData.data[i] = shade;
    imageData.data[i + 1] = shade;
    imageData.data[i + 2] = shade;
    imageData.data[i + 3] = Math.floor(Math.random() * 255);
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL();
}

/** Call once on startup to populate the grain overlay's background image. */
export function initGrain() {
  const overlay = document.getElementById('grain-overlay');
  overlay.style.backgroundImage = `url(${buildGrainDataURL()})`;
}

/**
 * Trigger the one-shot glitch animation on an element (see .glitch in
 * effects.css), then remove the class once it finishes so it can be
 * re-triggered on a later scene.
 */
export function triggerGlitch(element) {
  if (!element) return;
  element.classList.remove('glitch');
  void element.offsetWidth; // force reflow so re-adding the class restarts the animation
  element.classList.add('glitch');
  element.addEventListener('animationend', () => {
    element.classList.remove('glitch');
  }, { once: true });
}
