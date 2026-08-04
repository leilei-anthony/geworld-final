// play.js — play.html's entry script. This is today's game: path-select →
// scenes → endings. No content warning or menu here (index.html owns
// those); this page starts straight at path-select on load.

import { loadScene, setEndingHandler } from '../sceneEngine.js';
import '../audioManager.js'; // wires the mute/volume control as a side effect of importing it
import { initGrain, triggerGlitch } from '../effects.js';
import { renderCreditsInto } from '../creditsRenderer.js';

const PATH_SELECT_SCENE_ID = 'path-select';

const screens = {
  game: document.getElementById('screen-game'),
  ending: document.getElementById('screen-ending'),
};

function showScreen(name) {
  Object.values(screens).forEach((el) => el.classList.remove('active'));
  screens[name].classList.add('active');
}

function reportLoadError(err) {
  console.error(err);
  window.alert(
    'Could not load scene content.\n\n'
    + 'If you opened this file directly by double-clicking it, browsers block '
    + 'that from loading the JSON content files. Serve this folder with a local '
    + 'static server instead — see README.md for a one-line command.',
  );
}

function renderEnding(scene) {
  showScreen('ending');

  const stage = document.getElementById('ending-stage');
  const bg = document.getElementById('ending-background');
  const titleEl = document.getElementById('ending-title');
  const messageEl = document.getElementById('ending-message');
  const creditsViewport = document.getElementById('credits-viewport');
  const creditsScroll = document.getElementById('credits-scroll');

  stage.classList.toggle('screen-ending-death', scene.outcome === 'death');
  bg.src = scene.background ? `assets/backgrounds/${scene.background}` : '';
  bg.alt = scene.background || '';
  titleEl.textContent = scene.title || '';
  messageEl.textContent = scene.message || '';

  if (scene.showCredits) {
    creditsViewport.classList.remove('hidden');
    renderCreditsInto(creditsScroll, 'content/stats.json');
  } else {
    creditsViewport.classList.add('hidden');
    creditsScroll.innerHTML = '';
  }

  if (scene.glitch) {
    triggerGlitch(stage);
  }
}

// Autoplay policies require a genuine user gesture on *this* document before
// unmuted audio can play. path-select.json has no music of its own, so by
// the time a scene with music loads the player will already have clicked at
// least once — but this is a cheap, harmless safety net in case that ever
// changes. See js/audioManager.js's unlock() doc comment for details.
document.addEventListener('click', () => {
  const bgm = document.getElementById('bgm-audio');
  bgm.play().then(() => bgm.pause()).catch(() => {});
}, { once: true });

document.getElementById('play-again-button').addEventListener('click', () => {
  window.location.href = 'index.html';
});

initGrain();
setEndingHandler(renderEnding);
showScreen('game');
loadScene(PATH_SELECT_SCENE_ID).catch(reportLoadError);
