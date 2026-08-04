// resources.js — resources.html's entry script: renders two sections,
// "Research & Statistics" (content/stats.json, shared with the ending
// credits via creditsRenderer.js) and "Get Help" (content/help-resources.json).

import '../audioManager.js'; // wires the mute/volume control as a side effect of importing it
import { initGrain } from '../effects.js';
import { renderCreditsInto } from '../creditsRenderer.js';

async function renderHelpList() {
  const container = document.getElementById('help-list');
  try {
    const res = await fetch('content/help-resources.json', { cache: 'no-store' });
    const resources = await res.json();
    resources.forEach(({
      name, description, phone, link,
    }) => {
      const card = document.createElement('div');
      card.className = 'content-card';

      const nameEl = document.createElement('div');
      nameEl.className = 'content-card-title';
      nameEl.textContent = name;
      card.appendChild(nameEl);

      const bodyEl = document.createElement('div');
      bodyEl.className = 'content-card-body';
      bodyEl.textContent = description;
      card.appendChild(bodyEl);

      if (phone) {
        const phoneEl = document.createElement('div');
        phoneEl.className = 'content-card-subtitle';
        phoneEl.textContent = phone;
        card.appendChild(phoneEl);
      }

      if (link) {
        const linkEl = document.createElement('a');
        linkEl.href = link;
        linkEl.target = '_blank';
        linkEl.rel = 'noopener';
        linkEl.textContent = link;
        linkEl.className = 'content-card-subtitle';
        card.appendChild(linkEl);
      }

      container.appendChild(card);
    });
  } catch (err) {
    console.error('Could not load content/help-resources.json', err);
  }
}

initGrain();
renderCreditsInto(document.getElementById('research-list'), 'content/stats.json');
renderHelpList();
