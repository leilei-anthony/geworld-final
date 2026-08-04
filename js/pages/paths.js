// paths.js — paths.html's entry script. Walks content/scenes/*.json
// (listed in _manifest.json, since a static site can't list a directory)
// starting from path-select, and draws the resulting graph as an SVG
// node-link diagram: boxes = scenes, lines = choices. Disabled choices
// (the ones a player can see but never click) are drawn dashed rather than
// colored differently, so the distinction still reads once the grayscale
// filter is applied.
//
// Global choice percentages are an overlay on top of the structural graph —
// if Firebase isn't configured, the tree still renders completely, just
// without the percentages.

import '../audioManager.js'; // wires the mute/volume control as a side effect of importing it
import { initGrain } from '../effects.js';
import { initSiteMusic } from '../siteMusic.js';
import { getGlobalStatsForScene } from '../statsManager.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const ROOT_SCENE_ID = 'path-select';

const treeViewport = document.getElementById('tree-viewport');
const treeTooltip = document.getElementById('tree-tooltip');

// Must match #tree-viewport's padding-top in style.css: the tooltip is
// positioned in SVG-canvas pixel coordinates, but #tree-viewport's padding
// shifts the rendered canvas down inside the box by this many pixels.
const VIEWPORT_PADDING_TOP = 24;

const NODE_W = 170;
const NODE_H = 54;
const COLUMN_WIDTH = 340;
const ROW_HEIGHT = 150;
const MARGIN = 50;
const LABEL_CLEARANCE = 22; // vertical gap kept between an edge label and any node's top/bottom edge

function truncate(text, max) {
  if (!text) return '';
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

async function loadAllScenes() {
  const manifestRes = await fetch('content/scenes/_manifest.json', { cache: 'no-store' });
  const ids = await manifestRes.json();
  const scenes = await Promise.all(
    ids.map((id) => fetch(`content/scenes/${id}.json`, { cache: 'no-store' }).then((res) => res.json())),
  );
  const sceneMap = {};
  scenes.forEach((scene) => { sceneMap[scene.id] = scene; });
  return sceneMap;
}

// BFS from the root, assigning each scene to a column (= shortest distance
// from root) and a row (= discovery order within its column). This handles
// scenes reached by more than one edge (e.g. two choices leading to the
// same ending) without re-visiting or looping.
function layoutGraph(sceneMap, rootId) {
  const depthOf = new Map([[rootId, 0]]);
  const columns = new Map();
  const queue = [rootId];

  while (queue.length > 0) {
    const id = queue.shift();
    const depth = depthOf.get(id);
    if (!columns.has(depth)) columns.set(depth, []);
    columns.get(depth).push(id);

    const scene = sceneMap[id];
    if (!scene || scene.type === 'ending') continue;
    (scene.choices || []).forEach((choice) => {
      const targetId = choice.next;
      if (!sceneMap[targetId] || depthOf.has(targetId)) return;
      depthOf.set(targetId, depth + 1);
      queue.push(targetId);
    });
  }

  const positions = {};
  columns.forEach((ids, depth) => {
    ids.forEach((id, row) => {
      positions[id] = {
        x: MARGIN + depth * COLUMN_WIDTH,
        y: MARGIN + row * ROW_HEIGHT,
      };
    });
  });

  const maxDepth = Math.max(...columns.keys());
  const maxRows = Math.max(...Array.from(columns.values(), (ids) => ids.length));
  const width = MARGIN * 2 + (maxDepth + 1) * COLUMN_WIDTH;
  const height = MARGIN * 2 + maxRows * ROW_HEIGHT;

  return { positions, width, height };
}

function buildEdges(sceneMap) {
  const edges = [];
  Object.values(sceneMap).forEach((scene) => {
    if (!scene.choices) return;
    scene.choices.forEach((choice, index) => {
      if (!sceneMap[choice.next]) return; // dangling reference — skip gracefully
      edges.push({
        sourceId: scene.id,
        targetId: choice.next,
        text: choice.text,
        disabled: !!choice.disabled,
        choiceIndex: index,
      });
    });
  });

  // Multiple edges between the same pair of scenes (e.g. an enabled and a
  // disabled choice both leading to the same ending) would otherwise draw
  // exactly on top of each other — spread them with a small curve offset.
  const groups = new Map();
  edges.forEach((edge) => {
    const key = `${edge.sourceId}=>${edge.targetId}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(edge);
  });
  groups.forEach((group) => {
    group.forEach((edge, i) => {
      edge.curveOffset = (i - (group.length - 1) / 2) * 20;
      edge.groupIndex = i; // used to stack these edges' labels so they don't overlap each other
    });
  });

  return edges;
}

function hideTreeTooltip() {
  treeTooltip.classList.add('hidden');
}

// Shows the popup below (mx, anchorY) within #tree-viewport's scrolled
// content — anchorY should be the edge's own curve midpoint, not the label
// (the label already sits pushed up against the row's top clearance, so
// stacking the tooltip above *that* risked rendering above the scrollable
// viewport's top edge and getting clipped). There's open space below each
// row in this graph, so downward is the reliable direction.
// `stats` is { counts, total } | null — null, a zero total, or a missing
// count for this choice index all just mean "nothing to show yet."
function showTreeTooltip(mx, anchorY, stats, choiceIndex) {
  if (!stats || stats.total === 0 || stats.counts[choiceIndex] === undefined) {
    hideTreeTooltip();
    return;
  }
  const count = stats.counts[choiceIndex];
  const pct = Math.round((count / stats.total) * 100);
  treeTooltip.textContent = `${pct}% of players (${count} of ${stats.total}) chose this`;
  treeTooltip.style.left = `${mx}px`;
  treeTooltip.style.top = `${anchorY + VIEWPORT_PADDING_TOP + 14}px`;
  treeTooltip.classList.remove('hidden');
}

function svgEl(tag, attrs) {
  const el = document.createElementNS(SVG_NS, tag);
  Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
  return el;
}

function drawNode(svg, id, scene, pos) {
  const g = svgEl('g', {
    class: `tree-node${scene && scene.type === 'ending' ? ' tree-node-ending' : ''}`,
  });
  g.appendChild(svgEl('rect', {
    x: pos.x, y: pos.y, width: NODE_W, height: NODE_H,
  }));
  const label = svgEl('text', { x: pos.x + NODE_W / 2, y: pos.y + NODE_H / 2 + 4, 'text-anchor': 'middle' });
  label.textContent = truncate(id, 22);
  g.appendChild(label);
  svg.appendChild(g);
}

function drawEdge(svg, edge, sourcePos, targetPos, stats) {
  const sx = sourcePos.x + NODE_W;
  const sy = sourcePos.y + NODE_H / 2;
  const tx = targetPos.x;
  const ty = targetPos.y + NODE_H / 2;
  const mx = (sx + tx) / 2;
  const my = (sy + ty) / 2 + edge.curveOffset;
  const pathD = `M ${sx} ${sy} Q ${mx} ${my} ${tx} ${ty}`;

  const path = svgEl('path', {
    class: `tree-edge${edge.disabled ? ' tree-edge-disabled' : ''}`,
    d: pathD,
  });
  svg.appendChild(path);

  // A fat, invisible copy of the same curve, appended *after* (so it sits
  // on top in z-order and reliably wins hit-testing even on the exact
  // centerline pixels the thin visible line occupies) purely as a hover
  // hit target — the visible line is only 1.5px wide, far too thin to
  // reliably hover on its own. This follows the actual curve geometry
  // (rather than its rectangular bounding box), which matters when several
  // edges fan out from the same node — a bounding-box rect for a long
  // diagonal edge would otherwise overlap and steal hover from its
  // shorter same-row siblings near their shared origin point.
  const hitArea = svgEl('path', { class: 'tree-edge-hit', d: pathD });
  svg.appendChild(hitArea);

  let statsLabel = '';
  if (stats && stats.total > 0 && stats.counts[edge.choiceIndex] !== undefined) {
    const pct = Math.round((stats.counts[edge.choiceIndex] / stats.total) * 100);
    statsLabel = `— ${pct}%`;
  }

  // Same-row edges (the common case here — mostly a linear chain) run
  // straight through the vertical center of both flanking boxes, which is
  // exactly where those boxes' own labels sit. Lift the label clear above
  // the row instead of hovering it right on the connecting line.
  // When two edges connect the same pair of nodes (an enabled + a disabled
  // choice both leading to the same next scene), stack their labels instead
  // of stacking them on top of each other.
  const stackOffset = (edge.groupIndex || 0) * 16;
  const sameRow = sourcePos.y === targetPos.y;
  const labelY = sameRow
    ? Math.min(sourcePos.y, targetPos.y) - LABEL_CLEARANCE - stackOffset
    : my - LABEL_CLEARANCE - stackOffset;

  const labelText = truncate(edge.text, 20) + (statsLabel ? ` ${statsLabel}` : '') + (edge.disabled ? ' (disabled)' : '');

  const label = svgEl('text', { class: 'tree-edge-label', x: mx, y: labelY, 'text-anchor': 'middle' });
  label.textContent = labelText;
  svg.appendChild(label);

  // A backdrop rect behind the label so it stays legible over the grain
  // overlay and any line it happens to cross, sized to the rendered text
  // (only measurable once the element is actually in the DOM).
  const bbox = label.getBBox();
  const backdrop = svgEl('rect', {
    class: 'tree-edge-label-bg',
    x: bbox.x - 4,
    y: bbox.y - 2,
    width: bbox.width + 8,
    height: bbox.height + 4,
  });
  svg.insertBefore(backdrop, label);

  // The SVG's own coordinate space lines up 1:1 with CSS pixels inside
  // #tree-viewport (width/height attrs match the viewBox, no extra
  // scaling) other than the padding-top offset showTreeTooltip applies, so
  // mx/my can otherwise be used directly as the tooltip's position.
  // Anchored to the curve's own midpoint (not the label, which already
  // sits pushed up near the row's top edge) so it has room to drop below.
  const reveal = () => showTreeTooltip(mx, my, stats, edge.choiceIndex);
  hitArea.addEventListener('mouseenter', reveal);
  hitArea.addEventListener('mouseleave', hideTreeTooltip);
  label.addEventListener('mouseenter', reveal);
  label.addEventListener('mouseleave', hideTreeTooltip);
}

async function render() {
  const svg = document.getElementById('tree-svg');
  let sceneMap;
  try {
    sceneMap = await loadAllScenes();
  } catch (err) {
    console.error('Could not load scene manifest/files for the Paths page', err);
    return;
  }

  const { positions, width, height } = layoutGraph(sceneMap, ROOT_SCENE_ID);
  const edges = buildEdges(sceneMap);

  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('width', width);
  svg.setAttribute('height', height);

  // Global percentages are an overlay — fetched per decision-point scene,
  // resolves to null per-scene (not just globally) if unavailable.
  const decisionSceneIds = Object.values(sceneMap)
    .filter((scene) => scene.choices && scene.choices.length > 1)
    .map((scene) => scene.id);
  const statsResults = await Promise.all(
    decisionSceneIds.map((id) => getGlobalStatsForScene(id)),
  );
  const statsBySceneId = new Map(decisionSceneIds.map((id, i) => [id, statsResults[i]]));

  edges.forEach((edge) => {
    const sourcePos = positions[edge.sourceId];
    const targetPos = positions[edge.targetId];
    if (!sourcePos || !targetPos) return;

    const stats = statsBySceneId.get(edge.sourceId) || null;
    drawEdge(svg, edge, sourcePos, targetPos, stats);
  });

  Object.entries(positions).forEach(([id, pos]) => {
    drawNode(svg, id, sceneMap[id], pos);
  });
}

initGrain();
initSiteMusic();
render();
