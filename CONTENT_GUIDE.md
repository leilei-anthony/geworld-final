# Content Guide (no coding required)

This explains how to add and edit content across the site — scenes, images,
music, research stats, team credits, and help resources — without touching
any of the code in `js/` or `css/`.

## Before you start: how to preview your changes

Browsers won't let `index.html` load the JSON content files if you just
double-click it. From the project folder, run:

```
python3 -m http.server 8000
```

Then open `http://localhost:8000` in your browser. (Mac and most Linux
machines already have Python installed, so there's nothing to install.) Leave
that terminal window open while you preview; press `Ctrl+C` to stop the
server when you're done.

Every time you save a change to a JSON file or an image, just refresh the
browser tab to see it.

## How scenes work

Every scene the player sees — a conversation, a choice, an ending — is one
JSON file in `content/scenes/`. The `id` field must exactly match the
filename (minus `.json`), because other scenes link to it by that id.

Start by copying an existing file, like `content/scenes/man_intro.json`, and
editing the copy.

**Important:** after adding a new scene file, also add its `id` to
`content/scenes/_manifest.json` (just a flat list of scene ids). The game
itself doesn't need this — it follows each choice's `next` directly — but
the Paths page (`paths.html`) can't list a folder's contents on its own, so
it reads this file to know which scenes exist. Forgetting this step means
the story still plays correctly, it just won't show up on the Paths diagram.

### A regular scene (dialogue + choices)

```json
{
  "id": "man_scene_2",
  "type": "scene",
  "background": "office_day.svg",
  "music": "tense_hum.mp3",
  "sfx": null,
  "glitch": false,
  "characters": [
    { "id": "coworker", "sprite": "coworker_neutral.svg", "position": "right" }
  ],
  "dialogue": [
    { "speaker": "Coworker", "text": "Hey, you see the new girl yet?" }
  ],
  "choices": [
    { "text": "\"Not really my thing. Let's get back to work.\"", "next": "man_ending" },
    { "text": "Join in on the joke.", "next": "man_ending", "disabled": true }
  ]
}
```

Field by field:

- **`id`** — must match the filename exactly.
- **`type`** — `"scene"` for a normal scene, `"ending"` for an ending screen (see below).
- **`background`** — filename of an image in `assets/backgrounds/`.
- **`music`** — filename of an audio file in `assets/audio/`. Leave it `null`
  (or delete the line) to keep whatever track is already playing.
- **`sfx`** — optional one-off sound effect filename in `assets/audio/`, plays
  once when the scene loads without interrupting the music.
- **`glitch`** — set to `true` to play a brief unsettling visual glitch when
  this scene loads. Use it sparingly, right before something bad happens.
- **`characters`** — a list of who's on screen. `position` can be `"left"`,
  `"center"`, or `"right"`.
- **`dialogue`** — an ordered list of lines. Each line has a `speaker` (leave
  it `""` for narration/stage directions) and `text`. The player clicks the
  dialogue box to move to the next line.
- **`choices`** — one or two options shown after the dialogue ends. Each one
  needs `text` and `next` (the `id` of the scene it leads to).

### Changing the image or sound on a specific line

By default every line in a scene shares that scene's `background` and
`characters`. If you want a specific line to cut to a different image (a
close-up, a different room, a character walking in) or play its own sound
effect right when it appears, add any of these directly to that line:

```json
{
  "speaker": "Carter",
  "text": "Where are you rushing off to this early?",
  "background": "MAN-street-closeup.png",
  "characters": [
    { "id": "stranger", "sprite": "girl-scared.png", "position": "center" }
  ],
  "sfx": "footsteps.mp3"
}
```

All three (`background`, `characters`, `sfx`) are optional on a line — add
only the one(s) you need. Whatever a line doesn't specify just stays as it
was (the scene's starting image, or whatever the last line that changed it
set). This means you don't have to repeat `background`/`characters` on every
single line — only on the lines where something actually changes.

### A disabled (greyed-out) choice

Add `"disabled": true` to a choice. It will still be shown in full, but it's
visually greyed out and cannot be clicked — used on the Man path to show a
cruel option existing without it being selectable.

```json
{ "text": "Make a cruel joke about her", "next": "man_scene_3b", "disabled": true }
```

### An ending scene

Endings don't have `dialogue` or `choices` — instead they show a dedicated
ending screen.

```json
{
  "id": "woman_ending_survival",
  "type": "ending",
  "outcome": "survival",
  "background": "exit_door.svg",
  "music": "resolve_theme.mp3",
  "title": "She Made It Out",
  "message": "Some walked away. Most didn't get the choice.",
  "showCredits": true
}
```

- **`outcome`** — `"death"` shows a stark game-over treatment. `"survival"`
  or `"neutral"` show a calmer ending screen.
- **`title`** / **`message`** — the headline and the short line underneath it.
- **`showCredits`** — set to `true` to show the scrolling research-stats
  block (see below). Leave it `false` for endings that don't need it.

## Adding images

- Backgrounds go in `assets/backgrounds/`. Reference them by filename only
  in a scene's `"background"` field, e.g. `"background": "hallway.png"` means
  the file must be at `assets/backgrounds/hallway.png`.
- Character art goes in `assets/characters/`, referenced the same way in each
  character's `"sprite"` field.
- Any image format works (`.png`, `.jpg`, `.svg`). You don't need to
  black-and-white or grain-ify your images yourself — the game automatically
  desaturates everything to match the analog horror look.

## Adding audio

Drop `.mp3` files into `assets/audio/` and reference the filename in a
scene's `music` or `sfx` field. See `assets/audio/README.md` for more detail.
If a file doesn't exist yet, the game just stays silent — it won't crash.

There's also a single shared background music track that plays on every
page, including the start of a playthrough — set its filename in
`content/config.json`'s `siteMusic` field, e.g. `"siteMusic": "background.mp3"`.
A scene's own `music` field still overrides it once gameplay reaches that
scene, same as it would override any other track.

## Linking choices between scenes

A choice's `"next"` value must exactly match another scene's `"id"` field.
Typos here are the most common mistake — if a choice does nothing when
clicked, check the browser console (usually F12) for a "Could not load
scene" error, which means the `next` id doesn't match any scene file.

## Adding a new research stat to the ending credits

Open `content/stats.json`. It's a simple list — add a new entry anywhere:

```json
{
  "stat": "The fact or statistic itself, written as a full sentence.",
  "source": "Who published it, and the year.",
  "link": "https://example.com/the-actual-paper-or-article"
}
```

`"link"` is optional — add it and the source becomes a clickable citation
that opens in a new tab; leave it out and the source just shows as plain
text, same as before.

Every ending with `"showCredits": true` will automatically scroll through
the full list — you don't need to touch anything else.

## Global choice stats ("how other players chose")

The Paths page can show real percentages of how *every* player has answered
each choice — e.g. "64% (128) — Report it to HR," on hover over an edge in
the diagram. This is fully automatic: as long as the site's Firebase project
is set up (see `FIREBASE_SETUP.md`, a one-time setup step, not something you
touch per-scene), every choice a player clicks is counted automatically.
There is nothing to edit in any scene JSON for this — it just works once
Firebase is configured. If Firebase isn't set up yet (or a player is
offline), the Paths page simply doesn't show percentages — the rest of the
site is unaffected. (Ending screens don't show this — keeping it to just the
Paths page avoids repeating the same numbers on every playthrough's ending.)

## Adding a team member to the About page

Open `content/team-credits.json` and add an entry:

```json
{ "name": "Full Name", "role": "What they worked on" }
```

## Adding an asset/inspiration credit to the About page

Open `content/asset-credits.json` and add an entry:

```json
{ "name": "Tool or channel name", "note": "What it was used for" }
```

This is for tools, mood-boards, and reference material (Canva, Pinterest
boards, YouTube channels you drew inspiration from, etc.) — for people on
the team, use `content/team-credits.json` above instead.

## Adding a help resource to the Resources page

Open `content/help-resources.json` and add an entry:

```json
{
  "name": "Organization or hotline name",
  "description": "One or two sentences on what they do.",
  "phone": "1-800-000-0000",
  "link": "https://example.com"
}
```

`"phone"` and `"link"` are both optional — leave either as `""` to omit it.

## Editing the Main Menu, content warning, or how-to-play text

All of that copy lives in `content/config.json`, not in any code file.

## Questions?

If a scene doesn't seem to be loading right, check these first:
1. Is the local server still running? (See "Before you start" above.)
2. Does the JSON file's `id` match its own filename?
3. Does every choice's `next` value match another scene's `id` exactly?
4. If it's not appearing on the Paths page specifically: is its id listed
   in `content/scenes/_manifest.json`?
