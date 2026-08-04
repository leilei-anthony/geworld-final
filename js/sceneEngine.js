// sceneEngine.js — fetches a scene JSON file and renders it: background,
// character sprites, dialogue (advances one line per click), then either
// the scene's choices or a hand-off to the ending screen.
//
// This is the only file that needs to change if the scene JSON schema
// changes — see CONTENT_GUIDE.md for the schema non-coders write against.

import { playMusic, playSfx } from './audioManager.js';
import { triggerGlitch } from './effects.js';
import { goToScene, recordChoice } from './stateManager.js';
import { recordChoice as recordGlobalChoice } from './statsManager.js';

const CONTENT_BASE = 'content/scenes/';

const stage = document.getElementById('stage');
const bgEl = document.getElementById('scene-background');
const charLayer = document.getElementById('character-layer');
const dialogueBox = document.getElementById('dialogue-box');
const speakerEl = document.getElementById('speaker-name');
const textEl = document.getElementById('dialogue-text');
const choiceLayer = document.getElementById('choice-layer');

let currentScene = null;
let lineIndex = 0;
let onEnding = null; // registered by main.js so this module never touches #screen-ending directly

/** main.js calls this once at startup to receive control when an ending scene loads. */
export function setEndingHandler(fn) {
  onEnding = fn;
}

/** Load a scene by id (matches its JSON filename, minus ".json") and render it. */
export async function loadScene(sceneId) {
  // no-store: content JSON is hand-edited constantly during writing, and
  // browsers were caching stale scene files across edits/reloads.
  const res = await fetch(`${CONTENT_BASE}${sceneId}.json`, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`Could not load scene "${sceneId}" (HTTP ${res.status})`);
  }
  const scene = await res.json();

  goToScene(scene.id);
  playMusic(scene.music);
  playSfx(scene.sfx);

  if (scene.type === 'ending') {
    if (onEnding) onEnding(scene);
    return;
  }

  currentScene = scene;
  lineIndex = 0;
  renderBackground(scene.background);
  renderCharacters(scene.characters);

  choiceLayer.innerHTML = '';
  choiceLayer.style.display = 'none';
  dialogueBox.style.display = 'block';

  if (scene.glitch) {
    triggerGlitch(stage);
  }

  showLine();
}

function renderBackground(filename) {
  bgEl.src = filename ? `assets/backgrounds/${filename}` : '';
  bgEl.alt = filename || '';
}

function renderCharacters(characters) {
  charLayer.innerHTML = '';
  (characters || []).forEach((character) => {
    const img = document.createElement('img');
    img.className = `character-sprite pos-${character.position || 'center'}`;
    img.src = `assets/characters/${character.sprite}`;
    img.alt = character.id || '';
    charLayer.appendChild(img);
  });
}

function showLine() {
  const lines = currentScene.dialogue || [];
  if (lineIndex >= lines.length) {
    showChoices();
    return;
  }
  const line = lines[lineIndex];

  // Per-line media is optional — a line only swaps the background/characters/
  // sfx if it specifies its own; otherwise whatever's currently on screen
  // (the scene's defaults, or the last line that did override it) stays put.
  if (line.background) renderBackground(line.background);
  if (line.characters) renderCharacters(line.characters);
  if (line.sfx) playSfx(line.sfx);

  speakerEl.textContent = line.speaker || '';
  textEl.textContent = line.text || '';
}

function showChoices() {
  dialogueBox.style.display = 'none';
  choiceLayer.style.display = 'flex';
  choiceLayer.innerHTML = '';

  const choices = currentScene.choices || [];
  const allChoiceTexts = choices.map((c) => c.text);

  choices.forEach((choice, index) => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn' + (choice.disabled ? ' choice-disabled' : '');
    btn.textContent = choice.text;
    // aria-disabled (not the native "disabled" attribute) so the button stays
    // focusable — screen reader / keyboard users can still reach it and hear
    // that it's unavailable, rather than it silently vanishing from the tab
    // order. It's still genuinely unclickable: no click handler gets
    // attached below.
    if (choice.disabled) {
      btn.setAttribute('aria-disabled', 'true');
    }

    // Disabled choices are rendered greyed-out but stay genuinely unclickable
    // (no handler attached), not just visually inert — and are never recorded,
    // locally or globally, since they can't actually be picked.
    if (!choice.disabled) {
      btn.addEventListener('click', () => {
        recordChoice(currentScene.id, index, choice.text, allChoiceTexts, choice.next);
        recordGlobalChoice(currentScene.id, index); // fire-and-forget, never blocks navigation
        loadScene(choice.next).catch((err) => {
          console.error(err);
        });
      });
    }
    choiceLayer.appendChild(btn);
  });
}

// Advance dialogue on click. Only reachable while dialogueBox is visible,
// since it's hidden (display: none) once choices are showing.
dialogueBox.addEventListener('click', () => {
  lineIndex += 1;
  showLine();
});
