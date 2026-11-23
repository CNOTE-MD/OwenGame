# Jöntuka: A Viking Tale

**Main build: the browser version in `web/`** (play it via the published artifact link). The Godot project in the repo root is frozen as the original prototype; the browser build is the low-res reference for a later Unity rebuild.

## Browser build

| Path | What it is |
|---|---|
| `web/src/story.js` | Every word in the game, including everything Jon says on his own (`JON`). Owen can edit this. |
| `web/src/jon.js` | Jon's personality (faces, when he talks) and growth (XP, levels, perks, abilities) |
| `tools/maps.py` | ASCII maps for Norway, the Penguin Palace, the subway, the Barrow and Owen's room, plus a reachability checker |
| `web/src/tech.js` | Engine and SNES-hardware techniques: fixed 60 Hz timestep, Mode 7 taxi ride, HDMA-style heat haze and dream wobble, mosaic and iris transitions, SPC700-style echo, CRT filter (Y), developer overlay (` or F3) |
| `web/src/pixelfont.js` | The game's hand-built bitmap font (every glyph, accents and symbols included) and the shared window frame `drawPanel()` |
| `web/src/owen.js` | Built from Owen's Quest Log answers: the Varg, spiders, Jon's Compliment, the Leaf Rune, the giant's leaf wrap and sleeping log, three Arena cards, mini Chillys |
| `web/src/critters.js` | Owen's "Build the game" answers: possessed wombats, squirrels and Carolina dogs (freed, not killed), the Peanut Butter Lion on the beach, the riddle in Chilly's throne, Baron Blubber's secret sauna, and the choice menu |
| `web/src/owenscript.js` | OWEN'S SCRIPT (edit any scene, write Chapter 4, saved in the page's shared database), Easy/Normal, chapter title cards, the level-up and boss-defeated moments, the forge door |
| `web/src/editor.js` | Notebook paper and photos of Owen's real pages, Jon's memories of what you did, the RUSH Ø piano duel, Chilly's night (bolder creatures, Owen's own grave, resting at runestones), Owen's notes |
| `web/src/art3.js` | Pixel primitives (lines, ellipses, glows in quarter-step alpha), Scale2x/Scale3x for big sprites, framed boss bars, a hand-built Flight 364, villager props and room decor |
| `web/src/rock.js` | Jon remembers a song for each rune: the outdoor music fills back in layer by layer, a beat marker joins the HUD, chops on the beat hit 1.5x, bosses strike on the beat |
| `web/src/classics.js`, `music/classics.json`, `music/CLASSICS.md` | Free-to-use music played by the game's band: seven public-domain classics (Grieg, Bach, Beethoven; Mutopia Project) and four original rock and metal tracks their composers released as CC0 (OpenGameArt). `tools/arrange_classics.js` builds them from the files in `music/midi/`. Where each plays, and every source and license, are in `music/CLASSICS.md` |
| `web/src/mymusic.js` | MY MUSIC: bring your own MIDI files. Reads .mid files picked on the device, arranges them for the game's band, lists them at the top of the Jukebox, and can play one everywhere. Kept in that browser only; never uploaded and never part of the repo |
| `web/src/barrow.js` | The Drowned Barrow pass (a draft for Owen): Fluffy as the Barrow's guide (Jon translates a hint for wherever you are), the bell crypt (ring three spirit bells little, middle, big with the Voodoo Dash) and the Spirit Bell charm |
| `web/src/elf.js` | Owen's page 10: the elf, and his answer that the elf leads into the palace and into "dead Chilly". Also the palace concierge (hints), the ice-block puzzle room and Ice Skates, and the dungeon floor plan on the MAP page |
| `web/src/finish.js` | The finishing layer: credits with your stats, Jon's Trophy Wall, the options screen, fast-forward, control prompts, and fixes found by playing it through (see `REVIEW.md`) |
| `web/src/palace.js` | Owen's page 9: the front of Jjorvic Palace (hotel and cathedral, ten-plus Imperial Ruby arches, penguins on top) and his scene at the observation point |
| `web/src/giant.js` | Owen's page 6: the Forest Giant of the North boss at the log (stalk, slam, stuck window, hide as a tree) |
| `web/src/better.js` | Objective compass, the Penguin King's Royal Rage with icicles, ambient sound (birds, crickets, wind, drips, subway hum), controller rumble, the nap bench, deeds on the map page |
| `web/src/magic.js` | Magic and items: Rune Spells (Thunder, Frost, Fire, Mend on the rune meter), the Bag (salmon, lutefisk, shards), Charms (one worn at a time), the SPELLS and BAG menu pages |
| `web/src/awesome.js` | Boss title cards, hit-stop, combo callouts, the Jukebox, Snow Penguins and Royal Guards, King Owen, title-screen flair |
| `web/src/snes.js` | The SNES pass: day/night, weather, tall grass and muck, Spore Cap/Slime/Beetle, rune tablets, the map page, and Owen's page 5 (subway, taxi, the big log) |
| `web/src/*.js` | Engine, world, actors, sprites, UI, main loop |
| `web/src/arena.js` | Valhalla Arena: waves, shop cards, level-ups (tune or add cards here) |
| `tools/score.py` | The music: original pieces as step sequences. Rush-style odd meters for the title, overworld, dungeon, boss, arena, Bjarne and Barrow; four pieces in the sound of Owen's bands: Cold as Fjord (Foreigner) on the frozen screens, Don't Stop Choppin' (Journey) in the Muck Forest and the taxi, Walk This Fjord (Aerosmith) in the subway, Penguin Rhapsody (Queen) in the Penguin Palace. Run it, then `tools/music_to_midi.py` to refresh `music/midi/*.mid` |
| `OWEN_QUESTIONS.md` | Prompts to ask Owen after he plays; his answers drive the next build |
| `STORY_BIBLE.md` | Characters, chapter arc, items, the Red-Eye side quest, Arena mode |

Rebuild: `python3 tools/maps.py && python3 tools/build_web.py`. Test: `NODE_PATH=$(npm root -g) node tests/web_playtest.js`, then `tests/arena_playtest.js`, `tests/ch1_depth_test.js`, `tests/redeye_test.js`, `tests/ch2_test.js`, `tests/jon_test.js`, `tests/pad_test.js`, `tests/snes_test.js`, `tests/magic_test.js`, `tests/better_test.js`, `tests/giant_test.js`, `tests/owen_test.js`, `tests/polish_test.js`, `tests/tech_test.js`, `tests/critters_test.js`, `tests/script_test.js`, `tests/tour_test.js`, `tests/finish_test.js`, `tests/elf_test.js`, `tests/barrow_test.js`, `tests/ipad_test.js`, `tests/mymusic_test.js`, `tests/classics_test.js` and `tests/playthrough_test.js` (a bot plays Owen's nine pages with real inputs; about 90 seconds) the same way.

### Owen's link, and playing on an iPad

`web/index.html` is a whole document, so it runs from any plain web address. Both addresses below serve the `main` branch and update a minute or two after a merge.

| Address | What Owen sees | Status |
|---|---|---|
| https://cnote-md.github.io/OwenGame/ | The game, nothing else | **Needs GitHub Pages switched on once**: repo Settings, Pages, Source "Deploy from a branch", Branch `main`, folder `/ (root)`, Save. `.nojekyll` and the root `index.html` (a redirect to `web/`) are already in place for it |
| https://raw.githack.com/CNOTE-MD/OwenGame/main/web/index.html | A third-party "One more step" page with an advertisement first; tap "Open the page". It comes back about once a day | Works today. Fine as a stopgap, wrong as Owen's front door |

On an iPad or a phone it opens straight into the fill-the-window layout: the game screen, a thumbstick on the left, six buttons on the right. The small X in the corner goes back to the page (OWEN'S SCRIPT lives there); FULL SCREEN returns.

| To do this | Do this on the iPad |
|---|---|
| Make it a real full-screen app with its own icon | Open the link in Safari, tap Share, then Add to Home Screen. Open it from the new icon |
| Keep the save | Always play from the same place. The Safari tab and the home-screen icon each keep their own save, and Safari can clear a tab's save when the page goes unopened for a week or more; the home-screen app's save is not cleared that way |
| Play with no internet | Open it once online first. `web/sw.js` keeps a copy and only uses it when the network is down |
| Use a controller | Pair an Xbox, PlayStation or Switch Pro controller over Bluetooth; the touch controls hide themselves |
| Hear it | Sound starts on the first tap. If it is silent, check the iPad is not muted |
| Play your own songs | Put .mid files on the iPad (Files or iCloud Drive). In the game tap the X, then OWEN'S SCRIPT, My music, Add MIDI files. They appear at the top of the Jukebox (GEAR, then MUSIC); RUNE on a song makes it play everywhere |

| File | What it is |
|---|---|
| `web/head.html` | The document head for the standalone page: viewport, home-screen title and icon |
| `web/manifest.json`, `web/icon-180.png`, `web/icon-512.png` | The home-screen app's name and icon. Redraw the icon with `node tools/make_icon.js` |
| `web/sw.js` | The offline copy (network first, so a new build always wins when online; a host's notice page is never kept in place of the game) |
| `index.html`, `.nojekyll` (repo root) | For GitHub Pages: the short address redirects to `web/`, and Pages serves the files as they are |

The claude.ai artifact wraps the page in its own document, so it is published from the page without `head.html`: `python3 tools/build_web.py --artifact /some/path/jontuka.html`, then publish that file to the artifact's URL.

`tests/ipad_test.js` checks all of this in an emulated iPad (Chromium with touch at iPad sizes). That is not Safari on a real iPad; the first real run is still a test.

## Godot prototype (frozen)

A top-down action game in the style of SNES *A Link to the Past*, based on Owen's journal story. Godot 4.3.

## Play

**Mac:** download `builds/JontukaViking-mac.zip` and unzip it, then right-click the app and choose Open (the first launch is blocked until you do, because the app isn't signed).
**Windows:** unzip `builds/JontukaViking-windows.zip`, then double-click `JontukaViking.exe`; if SmartScreen warns, choose More info, then Run anyway.
**From source:** open this folder in Godot 4.3 and press F5.
**Rebuild:** `godot --headless --path . --export-release macOS export/mac/JontukaViking.zip` (also `Windows`, `Web`); needs Godot 4.3 export templates.

| Key | Action |
|---|---|
| Arrows / WASD, left stick, or the on-screen thumbstick | Move |
| ⛶ FULL SCREEN button | Fills the screen (iPad: tap it, then rotate to landscape). Controllers over Bluetooth: A swing, B throw, X thunder, Y horn, RB/RT dash, Start gear |
| Z / Space / J | Swing Jon (sword); also advances dialogue |
| X / K / Shift | Throw Jon (boomerang) |

Stepping into the lake makes Jon rocket you out onto the shore. The first time you die you come back as a voodoo zombie (hits harder); the second time is game over. Beat the possessed penguin boss to finish chapter 1.

## For Owen: change the game without coding

| File | What it controls |
|---|---|
| `data/dialogue.json` | Everything characters say, Jon's random quips, end text |
| `data/tuning.json` | Hearts, speeds, damage, penguin and boss health |
| `data/level_lake.txt` | The map. `T` tree, `#` rock, `~` lake, `s` sand, `.` grass, `@` start, `p` penguin, `B` boss, `L` lake landing spot |

Story source: `story/OWEN_STORY_TRANSCRIPT.md`. Design notes: `DESIGN.md`.

## Test

```
godot --headless --path . --script tests/smoke_test.gd
```
