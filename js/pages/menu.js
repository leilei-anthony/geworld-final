// menu.js — index.html's entry script: content-warning gate (once per
// browser tab session) + Main Menu copy, both sourced from
// content/config.json so none of this text lives in code.

import '../audioManager.js'; // wires the mute/volume control as a side effect of importing it
import { initGrain } from '../effects.js';
import { initSiteMusic } from '../siteMusic.js';

const WARNING_DISMISSED_KEY = 'geworld-warning-dismissed';

const screens = {
  warning: document.getElementById('screen-warning'),
  menu: document.getElementById('screen-menu'),
};

function showScreen(name) {
  Object.values(screens).forEach((el) => el.classList.remove('active'));
  screens[name].classList.add('active');
}

async function loadConfig() {
  const res = await fetch('content/config.json', { cache: 'no-store' });
  return res.json();
}

function populateWarningScreen(config) {
  document.getElementById('warning-heading').textContent = config.contentWarning.heading;
  document.getElementById('warning-body').textContent = config.contentWarning.body;
  document.getElementById('warning-button').textContent = config.contentWarning.buttonLabel;
}

function populateMenuScreen(config) {
  document.getElementById('menu-heading').textContent = config.gameTitle;
  document.getElementById('menu-subtitle').textContent = config.gameSubtitle;
  document.getElementById('menu-how-to-play').textContent = config.mainMenu.howToPlay;
  document.getElementById('play-button').textContent = config.mainMenu.playButtonLabel;
}

async function init() {
  initGrain();

  let config;
  try {
    config = await loadConfig();
  } catch (err) {
    console.error('Could not load content/config.json', err);
    return;
  }

  populateWarningScreen(config);
  populateMenuScreen(config);

  document.getElementById('warning-button').addEventListener('click', () => {
    sessionStorage.setItem(WARNING_DISMISSED_KEY, 'true');
    showScreen('menu');
  });

  // Once dismissed this tab session, skip straight to the menu — including
  // when navigating back to index.html from another page via the nav bar.
  showScreen(sessionStorage.getItem(WARNING_DISMISSED_KEY) === 'true' ? 'menu' : 'warning');
}

initSiteMusic();
init();
