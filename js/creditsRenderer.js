// creditsRenderer.js — renders a list of { stat, source, link } entries as
// "credit cards". Shared by play.js (the ending screen's research-stats
// scroll) and resources.js (the Resources page's Research & Statistics
// section), so the citation-link rendering only lives in one place.

/**
 * Fetches a stats-shaped JSON file (array of { stat, source, link }) and
 * renders one .credit-entry per item into `container`. `link` is optional —
 * with it, the source becomes a clickable citation; without it, plain text.
 */
export async function renderCreditsInto(container, jsonPath) {
  container.innerHTML = '';
  try {
    const res = await fetch(jsonPath, { cache: 'no-store' });
    const stats = await res.json();
    stats.forEach(({ stat, source, link }) => {
      const entry = document.createElement('div');
      entry.className = 'credit-entry';

      const statEl = document.createElement('div');
      statEl.className = 'credit-stat';
      statEl.textContent = stat;

      const sourceEl = document.createElement('div');
      sourceEl.className = 'credit-source';
      if (link) {
        const linkEl = document.createElement('a');
        linkEl.href = link;
        linkEl.target = '_blank';
        linkEl.rel = 'noopener';
        linkEl.textContent = source;
        sourceEl.appendChild(linkEl);
      } else {
        sourceEl.textContent = source;
      }

      entry.appendChild(statEl);
      entry.appendChild(sourceEl);
      container.appendChild(entry);
    });
  } catch (err) {
    console.error(`Could not load ${jsonPath}`, err);
  }
}
