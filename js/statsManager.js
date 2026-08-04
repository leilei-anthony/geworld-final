// statsManager.js — global (cross-player) choice tracking via Firebase
// Firestore. Loaded from the CDN as ES modules, so there's still no npm
// install / build step.
//
// This entire module is designed to be a safe no-op until a real Firebase
// project is wired up in firebaseConfig.js (see FIREBASE_SETUP.md) — every
// function resolves to null/undefined instead of throwing, so the rest of
// the game never has to know whether global stats are actually available.

import { firebaseConfig, isFirebaseConfigured } from './firebaseConfig.js';

const FIREBASE_APP_URL = 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
const FIRESTORE_URL = 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';

let contextPromise = null;

// Lazily loads the Firebase SDK + opens the Firestore connection exactly
// once, caching the result (including failures) for the rest of the session.
function getFirebaseContext() {
  if (!isFirebaseConfigured) return Promise.resolve(null);
  if (!contextPromise) {
    contextPromise = (async () => {
      try {
        const [{ initializeApp }, firestoreModule] = await Promise.all([
          import(FIREBASE_APP_URL),
          import(FIRESTORE_URL),
        ]);
        const {
          getFirestore, doc, setDoc, getDoc, increment,
        } = firestoreModule;
        const app = initializeApp(firebaseConfig);
        const db = getFirestore(app);
        return {
          db, doc, setDoc, getDoc, increment,
        };
      } catch (err) {
        console.error('Firebase unavailable — global choice stats disabled.', err);
        return null;
      }
    })();
  }
  return contextPromise;
}

/** Fire-and-forget: increment the global counter for this scene's choice index. */
export async function recordChoice(sceneId, choiceIndex) {
  const ctx = await getFirebaseContext();
  if (!ctx) return;
  try {
    await ctx.setDoc(
      ctx.doc(ctx.db, 'sceneChoices', sceneId),
      { [`choice_${choiceIndex}`]: ctx.increment(1) },
      { merge: true },
    );
  } catch (err) {
    console.error(`Could not record global choice for "${sceneId}"`, err);
  }
}

/**
 * Returns { counts: [n0, n1, ...], total } for a scene's recorded choices,
 * or null if global stats aren't available (not configured, offline, etc).
 */
export async function getGlobalStatsForScene(sceneId) {
  const ctx = await getFirebaseContext();
  if (!ctx) return null;
  try {
    const snap = await ctx.getDoc(ctx.doc(ctx.db, 'sceneChoices', sceneId));
    if (!snap.exists()) return { counts: [], total: 0 };
    const data = snap.data();
    const counts = [];
    let i = 0;
    while (data[`choice_${i}`] !== undefined) {
      counts.push(data[`choice_${i}`]);
      i += 1;
    }
    return { counts, total: counts.reduce((a, b) => a + b, 0) };
  } catch (err) {
    console.error(`Could not fetch global stats for "${sceneId}"`, err);
    return null;
  }
}
