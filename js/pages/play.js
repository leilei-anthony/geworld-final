// play.js — play.html's entry script. This is today's game: path-select →
// scenes → endings. No content warning or menu here (index.html owns
// those); this page starts straight at path-select on load.

import { loadScene, setEndingHandler } from '../sceneEngine.js';
import '../audioManager.js'; // wires the mute/volume control as a side effect of importing it
import { initGrain, triggerGlitch } from '../effects.js';
import { initSiteMusic } from '../siteMusic.js';
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

document.getElementById('play-again-button').addEventListener('click', () => {
  window.location.href = 'index.html';
});

initGrain();
setEndingHandler(renderEnding);
showScreen('game');
// Starts the same site-wide background track used on every other page
// (see siteMusic.js) — awaited before the first scene loads so a scene
// with its own "music" (e.g. man_livingroom_1's tv_white_noise.mp3) can't
// get raced and overwritten back to the default by a slow config fetch.
// Also covers the "needs one click before autoplay is allowed" retry that
// used to live here as its own listener — now handled once, centrally,
// inside initSiteMusic() itself.
initSiteMusic().then(() => loadScene(PATH_SELECT_SCENE_ID)).catch(reportLoadError);
