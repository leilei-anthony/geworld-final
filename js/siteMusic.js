// siteMusic.js — plays the shared background loop used on every page
// except play.html (which drives its own per-scene music via
// sceneEngine.js instead). Reads the track filename from
// content/config.json so a non-coder maintainer can swap it without
// touching code.

import { playMusic } from './audioManager.js';

/**
 * Fetch content/config.json and start the configured site-wide loop.
 * Quietly no-ops (matching this project's graceful-degradation pattern)
 * if config.json is unreadable or `siteMusic` isn't set.
 *
 * Browsers block unmuted autoplay until a real user gesture happens on
 * this document, so playMusic()'s own play() call may be silently
 * blocked at first — the click listener below retries it on the first
 * click anywhere on the page (nav link, mute button, "I Understand", etc).
 */
export async function initSiteMusic() {
  try {
    const res = await fetch('content/config.json', { cache: 'no-store' });
    const config = await res.json();
    playMusic(config.siteMusic);
  } catch (err) {
    console.error('Could not load content/config.json for site music', err);
  }

  document.addEventListener('click', () => {
    document.getElementById('bgm-audio').play().catch(() => {});
  }, { once: true });
}
