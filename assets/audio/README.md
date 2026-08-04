# Audio files go here

Drop `.mp3` (or `.ogg`) files directly in this folder, then reference the filename
in a scene's `"music"` or `"sfx"` field — for example `"music": "tense_hum.mp3"`
means the file should be at `assets/audio/tense_hum.mp3`.

- `music` = a looping background track. Only changes when a scene sets a
  different filename than what's already playing. Leave it out of a scene's
  JSON to keep whatever track is already playing.
- `sfx` = a one-off sound that plays once when the scene loads (a stinger,
  a door slam, etc.), without interrupting the background music.

If a filename doesn't exist yet, the game won't crash — it just stays silent
until the file is added.

## Site-wide background music

Separately from per-scene `music`/`sfx` above, the Menu, Paths, About, and
Resources pages (everywhere except actual gameplay in `play.html`) play one
shared looping track, configured by `content/config.json`'s `siteMusic`
field. Drop the file in this folder and set `siteMusic` to its filename —
same rule as above: if the file doesn't exist yet, the site just stays
silent, it won't crash.
