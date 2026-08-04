// stateManager.js — minimal in-memory game state for a single playthrough
// on play.html.
//
// No localStorage/persistence on purpose: a fresh page load — which is what
// "Play Again" does now that it navigates back to index.html — always starts
// with a clean module, so there's no separate reset() to maintain.

const state = {
  path: null,          // 'man' | 'woman' | null, inferred from scene id prefix
  currentSceneId: null,
  history: [],          // [{ sceneId, choiceIndex, choiceText, allChoiceTexts, nextSceneId }]
};

export function goToScene(sceneId) {
  state.currentSceneId = sceneId;
  if (state.path === null) {
    if (sceneId.startsWith('man_')) state.path = 'man';
    else if (sceneId.startsWith('woman_')) state.path = 'woman';
  }
}

// allChoiceTexts is the full list of option labels shown at this decision
// point (in scene JSON order) — kept here so the ending screen can render
// "how others chose" without re-fetching every scene file.
export function recordChoice(sceneId, choiceIndex, choiceText, allChoiceTexts, nextSceneId) {
  state.history.push({
    sceneId,
    choiceIndex,
    choiceText,
    allChoiceTexts,
    nextSceneId,
  });
}

export function getState() {
  return state;
}
