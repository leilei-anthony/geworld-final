# geworld-final

A browser-based, point-and-click visual novel about workplace mistreatment,
told from two perspectives (a "Man" path and a "Woman" path) chosen at the
start. Analog horror visual style: black & white, film grain, scanlines, and
occasional glitch effects.

Plain HTML/CSS/JavaScript. No build tools, no npm install.

## Running it locally

Browsers block a page from loading local JSON files (the scene content) when
you just double-click a page — that's a browser security restriction on the
`file://` protocol, not something this project can avoid while keeping
content in editable JSON files. So instead, serve the folder with any static
file server. The simplest option, since Python ships with macOS:

```
python3 -m http.server 8000
```

Then open `http://localhost:8000` in your browser. Any other static server
(VS Code's "Live Server" extension, `npx serve`, etc.) works too.

## Site map

A real multi-page site — each of these is its own `.html` file:

| Page | Purpose |
|---|---|
| `index.html` | Content warning (once per browser session) → Main Menu hub |
| `play.html` | The actual story: path-select → scenes → endings |
| `paths.html` | Auto-generated diagram of every scene and choice, with live global choice percentages |
| `about.html` | Team credits + project description |
| `resources.html` | Research stats + real-world help resources |

A persistent nav bar (Menu / Play / Paths / About / Resources) appears on
every page except `play.html`, which stays distraction-free during the story.

Because each page is a real navigation (not a single-page app), background
music restarts per page — only the volume/mute *preference* is remembered
across pages (via `localStorage`). Every page, including `play.html`, starts
with the same shared site-wide loop track (configured in
`content/config.json`'s `siteMusic` field, see `js/siteMusic.js`). During
gameplay, a scene can still override it via its own `music` field (e.g.
`man_livingroom_1`'s `tv_white_noise.mp3`) — once a scene does that, normal
per-scene music rules apply as before; scenes that don't set `music` just
leave whatever's already playing untouched.

## Project structure

```
index.html, play.html, paths.html, about.html, resources.html   the 5 pages
css/style.css                layout, typography, UI, nav bar
css/effects.css               grain, scanlines, glitch, black & white filter
js/                            shared engine modules (see comments in each file)
js/pages/*.js                   one small entry script per page
content/config.json              content warning / main menu / how-to-play text
content/scenes/*.json             one file per story scene — see CONTENT_GUIDE.md
content/scenes/_manifest.json      list of scene ids, used by the Paths page
content/stats.json                research stats (ending credits + Resources page)
content/team-credits.json          About page team list
content/help-resources.json        Resources page "Get Help" section
assets/backgrounds/, assets/characters/, assets/audio/   art + sound
```

## Adding story content

See [CONTENT_GUIDE.md](CONTENT_GUIDE.md) — written for teammates editing
JSON files directly, no coding background required.

## Global choice stats (optional)

The Paths page and every ending screen can show live, cross-player
percentages of how everyone has answered each choice ("64% chose to report
it to HR"), backed by a free Firebase Firestore database. This is a
one-time setup step — see [FIREBASE_SETUP.md](FIREBASE_SETUP.md). Until
it's done, those sections just stay empty/unlabeled; nothing else about the
site is affected.
