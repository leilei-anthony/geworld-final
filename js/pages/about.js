// about.js — about.html's entry script: loads content/team-credits.json and
// content/asset-credits.json, rendering the team list and the tools/references
// list. The description paragraph is static markup in about.html itself (edit
// it directly there).

import '../audioManager.js'; // wires the mute/volume control as a side effect of importing it
import { initGrain } from '../effects.js';
import { initSiteMusic } from '../siteMusic.js';

async function renderTeamList() {
  const container = document.getElementById('team-list');
  try {
    const res = await fetch('content/team-credits.json', { cache: 'no-store' });
    const team = await res.json();
    team.forEach(({ name, role }) => {
      const card = document.createElement('div');
      card.className = 'content-card';

      const nameEl = document.createElement('div');
      nameEl.className = 'content-card-title';
      nameEl.textContent = name;

      const roleEl = document.createElement('div');
      roleEl.className = 'content-card-subtitle';
      roleEl.textContent = role;

      card.appendChild(nameEl);
      card.appendChild(roleEl);
      container.appendChild(card);
    });
  } catch (err) {
    console.error('Could not load content/team-credits.json', err);
  }
}

async function renderAssetCredits() {
  const container = document.getElementById('asset-credits-list');
  try {
    const res = await fetch('content/asset-credits.json', { cache: 'no-store' });
    const credits = await res.json();
    credits.forEach(({ name, note }) => {
      const card = document.createElement('div');
      card.className = 'content-card';

      const nameEl = document.createElement('div');
      nameEl.className = 'content-card-title';
      nameEl.textContent = name;

      const noteEl = document.createElement('div');
      noteEl.className = 'content-card-subtitle';
      noteEl.textContent = note;

      card.appendChild(nameEl);
      card.appendChild(noteEl);
      container.appendChild(card);
    });
  } catch (err) {
    console.error('Could not load content/asset-credits.json', err);
  }
}

initGrain();
initSiteMusic();
renderTeamList();
renderAssetCredits();
